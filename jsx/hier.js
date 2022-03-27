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
     * @param {object[]} ast
     * @param {BaseComponent} parentComponent
     * @returns
     */
    createHierComponents(ast, parentComponent) {
      if (!ast) return []
      return ast.reduce((response, astObj) => {
        if (typeof astObj === "object" && astObj.hasOwnProperty("tagName")) {
          /**
           * Hier component found
           * Let's create new component instance, render and set his children and push it to tree
           */
          if (Util.getIsClass(astObj.tagName)) {
            const props = Util.cloneObject(astObj.props)
            const hierComponent = new astObj.tagName(props)
            hierComponent.parent = parentComponent

            if (astObj.children) {
              props.children = astObj.children
            }

            /** Replace AST with Hier Component */
            astObj = hierComponent
          } else if (astObj.children) {
            /** Hier component NOT found - common tag */
            console.log(astObj.children)
            astObj.children = Hier.createHierComponents(astObj.children, parentComponent)
          }
        }
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
      const rootComponent = Hier._innerRender(className)
      /** Mounting rendered component HTML to root node */
      if (rootNode && rootNode instanceof Node) rootNode.appendChild(rootComponent.node)

      /** Mounting nested components */
      const mountComponents = (component) => {
        if (component instanceof BaseComponent) {
          component.afterMount()

          if (component.props && component.props.children && Array.isArray(component.props.children)) {
            component.props.children.map(mountComponents)
          }
        } else if (component.children && Array.isArray(component.children)) {
          component.children.map(mountComponents)
        }
      }
      mountComponents(rootComponent)

      return rootComponent.node
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

      /** Rending component children */
      const createElementFromAstObject = (item, parentNode) => {
        if (typeof item === "object") {
          let tagName = item.tagName || item
          let node

          if (typeof tagName === "string") {
            node = Hier.createElement(tagName, item.props || null)
          } else {
            node = Hier._innerRender(item, parentNode).node
          }

          const children = (item.children || []).map((item) => createElementFromAstObject(item, node))
          children.map((child) => child && node.appendChild(child))

          return node
        } else {
          return Hier.createTextElement(item)
        }
      }

      const rendered = nestedComponents.map((item) => createElementFromAstObject(item, component.node))
      component.props.children = nestedComponents
      rendered.map((element) => component.node.appendChild(element))

      /** Mounting component to DOM root node */
      /** Removing unnecessary nested tags */
      while (component.node.childNodes.length === 1 && !(component.node.childNodes[0] instanceof Text)) {
        const tempNode = component.node.childNodes[0]
        component.node.remove()
        component.node = tempNode
      }

      component.node.$$component = component
      return component
    },

    /**
     * @param {Node} rootA
     * @param {Node} rootB
     * @returns
     */
    mergeNodes: function (rootA, rootB) {
      const maxElementsCount = Math.max(
        rootA.childNodes ? rootA.childNodes.length : 0,
        rootB.childNodes ? rootB.childNodes.length : 0
      )

      if (!maxElementsCount) return rootA

      const elementsA = Array.from(rootA.childNodes)
      const elementsB = Array.from(rootB.childNodes)

      for (let index = 0; index < maxElementsCount; index++) {
        const element = elementsA[index]
        const parallelElement = elementsB[index]

        if (!element && !parallelElement) {
          break
        } else if (!element && parallelElement) {
          /** New element has been added to the end */
          console.debug("[Adding new element]: ", parallelElement)
          rootA.appendChild(parallelElement)
        } else if (element && !parallelElement) {
          /** Element has been removed from the end */
          console.debug("[Removing element]: ", element)
          element.remove()
        } else if (element.tagName !== parallelElement.tagName) {
          /** unmount component and destroy the element */
          console.debug("[Unmount component]: ", element)
          if (element.$$component) element.$$component.beforeUnmount()
          console.debug("[Mount component]: ", parallelElement)
          element.replaceWith(parallelElement)
          if (element.$$component) delete element.$$component
          if (parallelElement.$$component) parallelElement.$$component.afterMount()
        } else {
          /** @todo Add KEY-mechanism */

          if (element.$$component && parallelElement.$$component) {
            const elementProps = Util.jsonSerialize(element.$$component.props)
            const parallelElementProps = Util.jsonSerialize(parallelElement.$$component.props)
            if (elementProps !== parallelElementProps) {
              element.$$component.props = parallelElement.$$component.props
            }
          }

          const elementAttrs = Util.getElementAttributes(element)
          const parallelElementAttrs = Util.getElementAttributes(parallelElement)

          if (JSON.stringify(elementAttrs) !== JSON.stringify(parallelElementAttrs)) {
            /** We need to set new attributes to element (and change props if this element is component) */
            Object.entries(parallelElementAttrs).map(([attr, value]) => element.setAttribute(attr, value))
          }

          if (element instanceof Text && element.nodeValue !== parallelElement.nodeValue) {
            element.nodeValue = parallelElement.nodeValue
          }

          Hier.mergeNodes(element, parallelElement)
        }
      }

      return rootA
    },
  }

  const Util = {
    /**
     * Convert component props (or any other object) to JSON.
     * Replaces BaseComponent instances to string
     * @param {*} obj
     * @returns
     */
    jsonSerialize: function (obj) {
      return JSON.stringify(obj, (key, value) => {
        if (value instanceof BaseComponent) return `__component_${value.constructor.name}__`
        return value
      })
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
    _props = {}
    props = {}
    parent = null
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
          this._props = currentValue
          console.log(`Props was changed from:`, prevProps, `to:`, currentValue)
        },
      })

      /** Create component root node for mounting */
      this.node = Hier.createElement("main", { $$component: this })

      console.debug("[Created]: ", this.constructor.name)
    }

    afterMount() {
      console.debug("[AfterMount]: ", this.constructor.name)
    }

    beforeUnmount() {
      console.debug("[BeforeUnmount]: ", this.constructor.name)
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
          const oldDom = this.node
          const rendered = Hier._innerRender(this, this.node)
          this.node = Hier.mergeNodes(oldDom, rendered.node)

          //   console.log(`State was changed from:`, prevState, `to:`, currentValue)
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
