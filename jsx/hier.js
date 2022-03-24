const Hier = {
  createElement(tagName, attributes, children) {
    const element = document.createElement(tagName)

    Object.entries(attributes || {}).map(([attribute, value]) => element.setAttribute(attribute, value))

    if (children) {
      if (!Array.isArray(children)) children = [children]
      children.map((child) => {
        if (!child) return
        element.appendChild(child instanceof Node ? child : document.createTextNode(child))
      })
    }
    return element
  },

  createTextElement(value) {
    return document.createTextNode(value)
  },
}

const HierParser = {
  PLACEHOLDER: `___PLACEHOLDER_${Date.now()}___`,

  html(splits, ...values) {
    const ast = HierParser.parseString(splits.join(HierParser.PLACEHOLDER), values)
    const createElement = (astObj) => {
      if (typeof astObj === "object") {
        const children = (astObj.children || []).map((item) => createElement(item))
        return Hier.createElement(astObj.tagName || astObj, astObj.props || null, children || [])
      } else {
        return Hier.createTextElement(astObj)
      }
    }

    return ast.map((item) => createElement(item))
  },

  /**
   * Parses an HTML template string and returns AST
   * @param {string} string html with placeholders
   * @param {Array} values list of placeholders replacements
   * @returns
   */
  parseString(string, values) {
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
            const value = HierParser.parseValue(dataMatched[0].trim(), values)

            if (value.length) {
              insertElementToTree(value)
            }
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
              const {
                groups: { tagName, attributes },
              } = tagMatched
              const selfClosing = attributes.slice(-1) === "/"
              const props = HierParser.parseProps(attributes, values)
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
  },

  parseProps(str, values) {
    str = " " + str.trim()

    const props = {}

    const matchNextProp = () => {
      return (
        /** Double quote */
        str.match(/ \w+="(?:[^\\"])*"/) ||
        /** Single quote */
        str.match(/ \w+='(?:[^\\'])*'/) ||
        /** Placeholder */
        str.match(new RegExp(` *\\w+=${HierParser.PLACEHOLDER}`)) ||
        /** Any other */
        str.match(/ *\w+/)
      )
    }

    let match
    while ((match = matchNextProp())) {
      let [key, ...value] = match[0].split("=")
      key = key.trim()

      value = value.join("=")
      if (value.match(new RegExp(`["']?${HierParser.PLACEHOLDER}["']?`))) {
        value = values.shift()
      } else {
        value = value ? value.slice(1, -1) : true
      }
      if (key.startsWith("on")) key = key.toLowerCase()

      props[key] = value
      str = str.slice(0, match.index) + str.slice(match.index + match[0].length)
    }

    return props
  },

  parseValue(str, values) {
    while (str.match(new RegExp(HierParser.PLACEHOLDER))) {
      const value = values.shift()

      if ([null, undefined, ""].includes(value) || !value) {
        str = str.replace(new RegExp(HierParser.PLACEHOLDER), "")
      } else {
        str = str.replace(new RegExp(HierParser.PLACEHOLDER), value)
      }
    }

    return str
  },
}
