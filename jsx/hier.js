const Hier = (function () {
  const defaultLogStyles = [
    "color: #fff; background-color: #444; padding: 2px 4px; border-radius: 2px; margin-left: -4px",
  ]
  const LogStyles = {
    base: defaultLogStyles.join(";"),
    light: [...defaultLogStyles, "color: #263238", "background-color: #eceff1"].join(";"),
    warning: [...defaultLogStyles, "color: #eee", "background-color: red"].join(";"),
    success: [...defaultLogStyles, "background-color: #43a047"].join(";"),
  }

  /**
   * HIER RENDERER
   */
  const Hier = {
    createElement(tagName, attributes, children) {
      if (tagName === "text") return document.createTextNode(attributes.value)
      const element = document.createElement(tagName)

      Object.entries(attributes || {}).map(([attribute, value]) => {
        if (/^on\w+/.test(attribute)) element[attribute.toLowerCase()] = value
        else {
          if (attribute === "className") attribute = "class"
          element.setAttribute(attribute, value)
        }
      })

      if (children) {
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

    _createTextAstObject(value) {
      return { tagName: "text", props: { value } }
    },

    /**
     * Create components from AST if needed
     * @param {object[]} ast
     * @param {BaseComponent} parentComponent
     * @returns
     */
    createHierComponents(ast, parentComponent) {
      if (!ast) return []
      return ast.reduce((response, astObj) => {
        if (typeof astObj === "string") {
          astObj = Hier._createTextAstObject(astObj)
        } else if (typeof astObj === "object" && astObj.hasOwnProperty("tagName")) {
          /**
           * Hier component found
           * Let's create new component instance, render and set his children and push it to tree
           */
          if (Util.getIsClass(astObj.tagName)) {
            const props = Util.cloneObject(astObj.props)
            const hierComponent = new astObj.tagName(props)

            if (astObj.children) {
              props.children = astObj.children
            }

            /** Replace AST with Hier Component */
            astObj = hierComponent
          } else if (astObj.children) {
            /** Hier component NOT found - common tag */
            astObj.children = Hier.createHierComponents(astObj.children, parentComponent)
          }
        }
        response.push(astObj)

        return response
      }, [])
    },

    _mountComponents(component) {
      if (component instanceof BaseComponent) {
        component.afterMount()

        if (component.props && component.props.children && Array.isArray(component.props.children)) {
          component.props.children.map(Hier._mountComponents)
        }
      } else if (component.children && Array.isArray(component.children)) {
        component.children.map(Hier._mountComponents)
      }
    },

    render(className, rootNode, props) {
      const componentName = className instanceof BaseComponent ? className.constructor.name : className.name
      __DEV__ && console.group(`%c[Render][${componentName}]`, LogStyles.light)
      __DEV__ && console.time(`⏰ ${componentName} rendered in`)

      let component = className instanceof BaseComponent ? className : new className(props)

      const proceedAstObject = (object, node) => {
        if (typeof object.tagName === "string") {
          const elementNode = Hier.createElement(object.tagName, object.props)
          object.node = elementNode
          node.appendChild(elementNode)

          if (object.children) {
            object.children = object.children.map((child) => proceedAstObject(child, elementNode))
          }
        } else {
          /** Current object is a component */
          const props = Object.assign({}, Util.cloneObject(object.props), { children: object.children })
          const nestedComponent = Hier.render(object.tagName, null, props)
          node.appendChild(nestedComponent.node)
          nestedComponent.afterMount()
          object = nestedComponent
        }

        return object
      }

      const ast = component.render()
      __DEV__ && console.debug(`%c[Rendered][${className.name}]`, LogStyles.success, component, ast)
      /** Or maybe here do we must pass AST tree to the children property? */
      component.props.children = Util.cloneObject(ast).map((object) => proceedAstObject(object, component.node))
      if (rootNode) rootNode.appendChild(component.node)

      __DEV__ && console.timeEnd(`⏰ ${componentName} rendered in`)
      __DEV__ && console.groupEnd()

      return component
    },

    /**
     * Renders AST objects to HTML nodes
     * @param {object|string} item
     * @returns {Node}
     */
    _createElementFromAstObject(item) {
      let tagName = item.tagName || item
      let node

      if (typeof tagName === "string") {
        node = Hier.createElement(tagName, item.props || null)
      } else {
        node = Hier._innerRender(item).node
      }
      if (!item.node) item.node = node

      const children = (item.children || []).map((item) => Hier._createElementFromAstObject(item))
      children.map((child) => child && node.appendChild(child))

      return node
    },

    _innerRender(className) {
      let component
      if (Util.getIsClass(className)) component = new className()
      else {
        /** Clone component root node to avoid mounted node changing */
        component = className
        component.node = Hier.createElement(
          component.node.tagName,
          Util.getElementAttributes(component.node),
          component.children || []
        )
      }

      const ast = component.render()
      const nestedComponents = Hier.createHierComponents(ast, component)

      const rendered = nestedComponents.map((item) => Hier._createElementFromAstObject(item))
      component.props.children = nestedComponents
      rendered.map((element) => component.node.appendChild(element))

      return component
    },

    rerenderComponent(component) {},
  }

  const Util = {
    /**
     * Convert component props (or any other object) to JSON.
     * Replaces BaseComponent instances to string
     * @param {*} obj
     * @returns
     */
    jsonSerialize: function (obj, prettyPrint) {
      return JSON.stringify(
        obj,
        (key, value) => {
          if (value instanceof BaseComponent) return `__component_${value.constructor.name}__`
          return value
        },
        prettyPrint ? 2 : 0
      )
    },
    /**
     * @param {object} obj
     * @returns {object}
     */
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

    /**
     * @param {Function} callable
     * @returns {boolean}
     */
    getIsClass: function (callable) {
      if (typeof callable !== "function") return false
      return /^class *\w+.*{/.test(callable)
    },

    /**
     * @param {HTMLElement} element
     * @returns {object} Element attributes
     */
    getElementAttributes: function (element) {
      const attributes = element.attributes
      if (!attributes || !attributes.length) return {}
      const result = {}
      for (let index = 0; index < attributes.length; index++) {
        const attribute = attributes[index]
        result[attribute.name] = attribute.value
      }
      return result
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

    _createTextAstObject: (value) => ({ tagName: "text", props: { value } }),

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
                let valueObject = value
                if (typeof valueObject === "string") valueObject = HierParser._createTextAstObject(value)
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
    _props = {}
    props = {}
    node = null

    constructor(props) {
      if (props && typeof props !== "object") throw new Error("Please specify correct props object.")
      this._initChangeableAttr("_props")
      this._props = props || {}

      /** Initialisation props object */
      Object.defineProperty(this, "props", {
        configurable: false,
        enumerable: false,
        get: () => {
          return this._props || {}
        },
        set: (currentValue) => {
          const prevProps = this._props
          if (Util.jsonSerialize(prevProps) === Util.jsonSerialize(currentValue)) {
            console.debug(`[Props didn't changed] [${this.constructor.name}]`)
            return
          }

          this._props = currentValue
          console.debug(`[${this.constructor.name}] Props was changed from:`, prevProps, `to:`, currentValue)
          Hier.rerenderComponent(this)
        },
      })

      /** Create component root node for mounting */
      this.node = Hier.createElement("main", { "data-component": this.constructor.name })

      console.debug("%c[Created Component]", LogStyles.light, this.constructor.name)
    }

    afterMount() {
      console.debug("%c[AfterMount]", LogStyles.light, this.constructor.name)
    }

    beforeUnmount() {
      console.debug("%c[BeforeUnmount]", LogStyles.light, this.constructor.name)
    }

    _initChangeableAttr(attr, defaultValue) {
      Object.defineProperty(this, attr, {
        configurable: false,
        enumerable: false,
        value: defaultValue || {},
      })
    }

    toJSON() {
      return {
        "[[ComponentName]]": this.constructor.name,
        props: this._props,
      }
    }

    render() {
      return null
    }
  }

  class Component extends BaseComponent {
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
          const prevState = this._state
          this._state = currentValue

          /**
           * RE-RENDER PROCESS
           */
          console.log(`[${this.constructor.name}] State was changed from:`, prevState, `to:`, currentValue)
          Hier.rerenderComponent(this)
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
    createElement: Hier.createElement,
    render: Hier.render,
    html: HierParser.ast,
    BaseComponent,
    Component,
  }
})()
