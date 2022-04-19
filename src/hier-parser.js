const HierParser = (function () {
  const PLACEHOLDER = `___PLACEHOLDER_${Date.now()}___`

  /**
   * Parses HTML string from JS template literal
   * @param {string[]} splits String parts splitted by JS template literal
   * @param  {...any} values
   * @returns {object} AST tree of parsed HTML
   */
  const ast = (splits, ...values) => parseString(splits.join(PLACEHOLDER), values)

  /**
   * Parses HTML string from JS template literal
   * @param {string[]} splits String partes splitted by JS template literal
   * @param  {...any} values
   * @returns {Node[]} HTML Nodes list
   */
  const html = (splits, ...values) => {
    const ast = ast(splits, ...values)
    let response = new Array(ast.length)
    for (let item of ast) createElementFromAstObject(item)
    return response.filter((item) => item)
  }

  /**
   * Creates HTML element by specified AST object
   * @inner
   * @param {object{tagName: string, props: object, children: object[]}} astObject
   * @returns {HTMLElement|Text}
   */
  const createElementFromAstObject = function (astObject) {
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
  const _createTextAstObject = (value) => ({ tagName: "textString", props: { value } })

  /**
   * Parses an HTML template string and returns AST
   * @inner
   * @param {string} string html with placeholders
   * @param {Array} values list of placeholders replacements
   * @returns {object} AST tree of specified HTML string
   */
  const parseString = function (string, values) {
    const STATES = {
      data: "data",
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
    let str = string.trim()
    let prevStr
    let insideSvg
    let hasNoChanges = 0

    while (str.length) {
      if (hasNoChanges > 3) {
        console.error("Parsing error.", { state, str, prevStr })
        break
      }

      if (prevStr === str) hasNoChanges++
      else hasNoChanges = 0

      prevStr = str
      switch (state) {
        case STATES.data:
          const dataMatched = str.match(/^[^<]+/)
          if (dataMatched) {
            parseValue(dataMatched[0], values, (value) => {
              let valueObject = value
              if (typeof valueObject === "string") valueObject = _createTextAstObject(value)
              insertElementToTree(valueObject)
            })
            str = str.slice(dataMatched.index + dataMatched[0].length)
          }
          state = STATES.tag
          break

        case STATES.tag:
          const closeMatched = str.match(/^<\/[\w:]+[^<]*>/)
          if (closeMatched) {
            str = str.slice(closeMatched.index + closeMatched[0].length)
            const _element = openedTagsStack.pop()
            /** For SVG supporting */
            if (_element.tagName === "svg") insideSvg = false
          } else {
            const tagMatched = str.match(/<(?<tagName>[\w:]+)[^\s\/>]*\s?(?<attributes>[^>]*)>/)
            if (tagMatched) {
              let {
                groups: { tagName, attributes },
              } = tagMatched
              tagName = parseTagName(tagName, values)
              const selfClosing = attributes.slice(-1) === "/"
              const props = parseProps(attributes, values)
              const element = { tagName: insideSvg ? `svg:${tagName}` : tagName, props }
              insertElementToTree(element)

              if (!selfClosing) {
                openedTagsStack.push(element)
                /** For SVG supporting */
                if (tagName === "svg") insideSvg = true
              }
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
   * Parses string of HTML tag  es
   * @inner
   * @param {string} str
   * @param {any[]} values placeholders list
   * @returns {object} HTML tag attributes, properties
   */
  const parseProps = function (str, values) {
    str = str.trim()

    let props = {}
    const bothPlaceholdersRegexp = new RegExp(`^${PLACEHOLDER}=(["'])?${PLACEHOLDER}\\1?`),
      justPlaceholderRegexp = new RegExp(`^${PLACEHOLDER}[\\s|\\/]`),
      attrPlaceholderRegexp = new RegExp(`^:?${PLACEHOLDER}=(["'])?(?:[^\\"])*\\1?`),
      valuePlaceholderRegexp = new RegExp(`^:?[\\w-]+=["']?${PLACEHOLDER}["']?`),
      placeholderRegexp = new RegExp(`${PLACEHOLDER}`),
      clearValue = (value) => value.replace(/^["']/, "").replace(/["']$/, "")

    const matchNextProp = () => {
      return (
        /** Both attribute name and value are placeholders */
        str.match(bothPlaceholdersRegexp) ||
        /** Attribute name placeholder */
        str.match(attrPlaceholderRegexp) ||
        /** Attribute value placeholder */
        str.match(valuePlaceholderRegexp) ||
        /** Just placeholder */
        str.match(justPlaceholderRegexp) ||
        /** Common attribute */
        str.match(/:?[\w-]+=(["'])(?:[^\\"])*\1/) ||
        /** Any other */
        str.match(/:?[\w-]+/)
      )
    }

    let match
    while ((match = matchNextProp())) {
      let [key, ...value] = match[0].split("=")
      key = key.trim()
      value = value.join("=")

      const valuePlaceholderMatch = str.match(valuePlaceholderRegexp)
      if (str.match(bothPlaceholdersRegexp)) {
        /**
         * Both attribute name and value are placeholders
         */
        const _key = values.shift(),
          _value = values.shift()
        if (typeof _key === "string") props[_key] = _value
      } else if (str.match(attrPlaceholderRegexp)) {
        /**
         * Attribute name placeholder
         */
        const _value = values.shift()
        if (typeof _value !== "object") props[_value] = clearValue(value)
      } else if (valuePlaceholderMatch) {
        /**
         * Variable was passed as attribute value
         */
        value = values.shift()
        props[key] = value
      } else if (str.match(justPlaceholderRegexp)) {
        /**
         * Object with properties was passes as placeholder
         */
        const _value = values.shift()
        if (typeof _value === "object") props = Object.assign({}, props, _value)
      } else {
        /**
         * Common element attribute
         */

        /** Lets find and replace all placeholders */
        let placeholderMatch
        const placeholderNextMatch = () => (placeholderMatch = value.match(placeholderRegexp))
        while ((placeholderMatch = placeholderNextMatch())) {
          const _value = values.shift()
          value = value.replace(placeholderRegexp, typeof _value !== "object" ? _value : "")
        }

        value = value ? value.slice(1, -1) : true
        props[key] = value
      }

      str = str.slice(0, match.index) + str.slice(match.index + match[0].length)
      str = str.trim()
    }

    return props
  }

  /**
   * @inner
   * @param {*string} str
   * @param {any[]} values placeholders list
   * @returns {string}
   */
  const parseTagName = function (str, values) {
    if (str.match(new RegExp(PLACEHOLDER))) return values.shift()
    return str
  }

  /**
   * Parses data string and calls the callback-function for each met placeholder
   * @inner
   * @param {string} str
   * @param {any[]} values placeholders list
   * @param {Function{value: any}} callback
   */
  const parseValue = function (str, values, callback) {
    let text = str.replace(/\n/, "").replace(/\s+/, " ")
    while (text.match(new RegExp(PLACEHOLDER))) {
      const value = values.shift()

      if (!value || Array.isArray(value) || [null, undefined, ""].includes(value)) {
        if (Array.isArray(value)) {
          for (let item of value) callback(item)
        }

        text = text.replace(new RegExp(PLACEHOLDER), "")
      } else {
        text = text.replace(new RegExp(PLACEHOLDER), value)
      }
    }

    if (text.trim().length) {
      callback(text)
    }
  }

  return { ast, html, PLACEHOLDER, parseString }
})()
