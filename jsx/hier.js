const Hier = (function () {
  const EVENT_RERENDER = "rerender"

  /**
   * HIER RENDERER
   */
  const Hier = {
    createElement(tagName, attributes, children) {
      const element = document.createElement(tagName)

      Object.entries(attributes || {}).map(([attribute, value]) => (element[attribute] = value))

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

    /**
     * Create components from AST if needed
     */
    createHierComponents(ast) {
      if (!ast) return []
      return ast.reduce((response, astObj) => {
        if (typeof astObj === "object" && astObj.hasOwnProperty("tagName")) {
          /** Hier component found */
          if (Util.getIsClass(astObj.tagName)) {
            const props = Util.cloneObject(astObj.props)
            if (astObj.children) {
              props.children = astObj.children
            }
            const hierComponent = new astObj.tagName(props)
            const componentRendered = hierComponent.render()
            Hier.createHierComponents(componentRendered).map((nestedItem) => response.push(nestedItem))
          } else if (astObj.children) {
            /** Hier component NOT found - common tag */
            astObj.children = Hier.createHierComponents(astObj.children)
          }
        }
        /** Just text */
        response.push(astObj)

        return response
      }, [])
    },

    /**
     * Renders root application component
     * @param {*} className
     * @param {*} rootNode
     */
    render(className, rootNode) {
      const rootComponent = new className()

      const ast = rootComponent.render()
      const components = Hier.createHierComponents(ast)
      const rendered = components.map((item) => HierParser.createElementFromAstObject(item))
      rendered.map((element) => element && rootNode.appendChild(element))
    },
  }

  const Util = {
    cloneObject: function (obj) {
      const newObj = Object.assign({}, obj || {})
      Object.entries(newObj).map(([key, value]) => {
        if (Array.isArray(value)) {
          newObj[key] = [...value]
        } else if (typeof value !== "object") {
          newObj[key] = value
        } else {
          newObj[key] = Util.cloneObject(value)
        }
      })
      return Array.isArray(obj) ? Object.values(newObj) : newObj
    },
    getIsClass: function (callable) {
      if (typeof callable !== "function") return false
      return /^class *\w+.*{/.test(callable)
    },
  }

  /**
   * HIER PARSER
   */
  const HierParser = {
    PLACEHOLDER: `___PLACEHOLDER_${Date.now()}___`,

    ast(splits, ...values) {
      return HierParser.parseString(splits.join(HierParser.PLACEHOLDER), values)
    },

    html(splits, ...values) {
      const ast = HierParser.ast(splits, ...values)
      return ast.map((item) => HierParser.createElementFromAstObject(item)).filter((item) => item)
    },

    createElementFromAstObject(astObject) {
      const createElement = (item) => {
        if (typeof item === "object") {
          const children = (item.children || []).map((item) => createElement(item))
          let tagName = item.tagName || item
          if (typeof tagName === "string") {
            return Hier.createElement(tagName, item.props || null, children || [])
          }
        } else {
          return Hier.createTextElement(item)
        }
      }

      return createElement(astObject)
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
              HierParser.parseValue(dataMatched[0], values, (value) => {
                insertElementToTree(value)
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
                tagName = HierParser.parseTagName(tagName, values)
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

      const props = {}
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

    parseTagName(str, values) {
      if (str.match(new RegExp(HierParser.PLACEHOLDER))) return values.shift()
      return str
    },

    parseValue(str, values, callback) {
      let text = str.replace(/\n/, "").replace(/\s+/, " ")
      while (text.match(new RegExp(HierParser.PLACEHOLDER))) {
        const value = values.shift()

        if (!value || Array.isArray(value) || [null, undefined, ""].includes(value)) {
          if (Array.isArray(value)) {
            value.map((item) => callback(item))
          }

          text = text.replace(new RegExp(HierParser.PLACEHOLDER), "")
        } else {
          text = text.replace(new RegExp(HierParser.PLACEHOLDER), value)
        }
      }

      if (text.trim().length) {
        callback(text)
      }
    },
  }

  /**
   * HIER COMPONENTS
   */
  class BaseComponent {
    _prevProps = {}
    _props = {}
    props = {}
    node = null

    constructor(props) {
      if (props && typeof props !== "object") throw new Error("Please specify correct props object.")
      this._initChangeableAttr("_props")
      this._props = props || {}
      this._prevProps = this._props

      /** Initialisation props object */
      Object.defineProperty(this, "props", {
        configurable: false,
        enumerable: false,
        get: () => {
          return this._props || {}
        },
        set: (currentValue) => {
          this._prevProps = this._props
          this._props = currentValue
          console.log(`Props was changed from:`, this._prevProps, `to:`, currentValue)
        },
      })
    }

    _initChangeableAttr(attr, defaultValue) {
      Object.defineProperty(this, attr, {
        configurable: false,
        enumerable: false,
        value: defaultValue || {},
      })
    }

    render() {
      return null
    }
  }

  class Component extends BaseComponent {
    _prevState = {}
    _state = {}

    constructor(props) {
      super(props)
      this._initChangeableAttr("_state")

      /** Initialisation state object */
      Object.defineProperty(this, "state", {
        configurable: false,
        enumerable: false,
        get: () => {
          return this._state || {}
        },
        set: (currentValue) => {
          this._prevState = this._state
          this._state = currentValue
          console.log(`State was changed from:`, this._prevState, `to:`, currentValue)
        },
      })
    }

    /**
     * @param {object} partialState
     */
    setState(partialState) {
      const prevState = this.state
      this.state = Object.assign({}, prevState || {}, partialState)
    }
  }

  return {
    render: Hier.render,
    html: HierParser.ast,
    BaseComponent,
    Component,
  }
})()
