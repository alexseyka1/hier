function HierParser() {
  this.PLACEHOLDER = `___PLACEHOLDER_${Date.now()}___`

  /**
   * Parses HTML string from JS template literal
   * @param {string[]} splits String parts splitted by JS template literal
   * @param  {...any} values
   * @returns {object} AST tree of parsed HTML
   */
  const ast = (splits, ...values) => this.parseString(splits.join(this.PLACEHOLDER), values)

  /**
   * Parses HTML string from JS template literal
   * @param {string[]} splits String partes splitted by JS template literal
   * @param  {...any} values
   * @returns {Node[]} HTML Nodes list
   */
  const html = (splits, ...values) => {
    const ast = this.ast(splits, ...values)
    let response = new Array(ast.length)
    for (let item of ast) this.createElementFromAstObject(item)
    return response.filter((item) => item)
  }

  /**
   * Creates HTML element by specified AST object
   * @inner
   * @param {object{tagName: string, props: object, children: object[]}} astObject
   * @returns {HTMLElement|Text}
   */
  this.createElementFromAstObject = function (astObject) {
    const createElement = (item) => {
      if (typeof item === "object") {
        const children = new Array((item.children || []).length)
        for (let child of item.children) createElement(child)
        let tagName = item.tagName || item
        if (typeof tagName === "string") {
          return Hier.createElement(tagName, item.props || null, children || [])
        }
      } else {
        return document.createTextNode(item)
      }
    }

    return createElement(astObject)
  }

  /**
   * Creates AST object for text string
   * @inner
   * @param {string} value
   * @returns {object{tagName: string, props: object}}
   */
  this._createTextAstObject = (value) => ({ tagName: "text", props: { value } })

  /**
   * Parses an HTML template string and returns AST
   * @inner
   * @param {string} string html with placeholders
   * @param {Array} values list of placeholders replacements
   * @returns {object} AST tree of specified HTML string
   */
  this.parseString = function (string, values) {
    const STATES = {
      data: "date",
      tag: "tag",
    }

    let tokensStack = [],
      openedTagsStack = []

    const insertElementToTree = (element) => {
      /** If we have an opened tag we must append new token to his children list */
      const lastOpenedTag = openedTagsStack[openedTagsStack.length - 1]
      if (lastOpenedTag) {
        if (!lastOpenedTag.children) lastOpenedTag.children = []
        lastOpenedTag.children.push(element)
      } else {
        tokensStack.push(element)
      }
    }

    let state = STATES.data
    let str = string
    let loop = 0

    while (str.length) {
      if (++loop >= 1000) {
        console.error("Parsing error. So much loops.", { state, str })
        break
      }

      switch (state) {
        case STATES.data:
          const dataMatched = str.match(/^[^<]+/)
          if (dataMatched) {
            this.parseValue(dataMatched[0], values, (value) => {
              let valueObject = value
              if (typeof valueObject === "string") valueObject = this._createTextAstObject(value)
              insertElementToTree(valueObject)
            })
            str = str.slice(dataMatched.index + dataMatched[0].length)
          }
          state = STATES.tag
          break

        case STATES.tag:
          const closeMatched = str.match(/^<\/\w+.*>/)
          if (closeMatched) {
            str = str.slice(closeMatched.index + closeMatched[0].length)
            openedTagsStack.pop()
          } else {
            const tagMatched = str.match(/<(?<tagName>\w+)[^\s\/>]*\s?(?<attributes>[^>]*)>/)
            if (tagMatched) {
              let {
                groups: { tagName, attributes },
              } = tagMatched
              tagName = this.parseTagName(tagName, values)
              const selfClosing = attributes.slice(-1) === "/"
              const props = this.parseProps(attributes, values)
              const element = { tagName, props }
              insertElementToTree(element)

              if (!selfClosing) openedTagsStack.push(element)
              str = str.slice(tagMatched.index + tagMatched[0].length)
            }
          }
          state = STATES.data
          break
      }
    }

    return tokensStack
  }

  /**
   * Parses string of HTML tag attributes
   * @inner
   * @param {string} str
   * @param {any[]} values placeholders list
   * @returns {object} HTML tag attributes, properties
   */
  this.parseProps = function (str, values) {
    str = " " + str.trim()
    const matchNextProp = () => {
      return (
        /** Double quote */
        str.match(/ \w+="(?:[^\\"])*"/) ||
        /** Single quote */
        str.match(/ \w+='(?:[^\\'])*'/) ||
        /** Placeholder */
        str.match(new RegExp(` *\\w+=${this.PLACEHOLDER}`)) ||
        /** Any other */
        str.match(/ *\w+/)
      )
    }

    const props = {}
    let match
    while ((match = matchNextProp())) {
      let [key, ...value] = match[0].split("=")
      key = key.trim()

      value = value.join("=")
      if (value.match(new RegExp(`["']?${this.PLACEHOLDER}["']?`))) {
        value = values.shift()
      } else {
        value = value ? value.slice(1, -1) : true
      }

      props[key] = value
      str = str.slice(0, match.index) + str.slice(match.index + match[0].length)
    }

    return props
  }

  /**
   * @inner
   * @param {*string} str
   * @param {any[]} values placeholders list
   * @returns {string}
   */
  this.parseTagName = function (str, values) {
    if (str.match(new RegExp(this.PLACEHOLDER))) return values.shift()
    return str
  }

  /**
   * Parses data string and calls the callback-function for each met placeholder
   * @inner
   * @param {string} str
   * @param {any[]} values placeholders list
   * @param {Function{value: any}} callback
   */
  this.parseValue = function (str, values, callback) {
    let text = str.replace(/\n/, "").replace(/\s+/, " ")
    while (text.match(new RegExp(this.PLACEHOLDER))) {
      const value = values.shift()

      if (!value || Array.isArray(value) || [null, undefined, ""].includes(value)) {
        if (Array.isArray(value)) {
          for (let item of value) callback(item)
        }

        text = text.replace(new RegExp(this.PLACEHOLDER), "")
      } else {
        text = text.replace(new RegExp(this.PLACEHOLDER), value)
      }
    }

    if (text.trim().length) {
      callback(text)
    }
  }

  return { ast, html }
}
