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
          object = nestedComponent
        }

        return object
      }

      const ast = component.render()
      __DEV__ && console.debug(`%c[Rendered][${className.name}]`, LogStyles.success, component, ast)
      /** Or maybe here do we must pass AST tree to the children property? */
      component.props.children = Util.cloneObject(ast).map((object) => proceedAstObject(object, component.node))
      if (rootNode) rootNode.appendChild(component.node)
      component.afterMount()

      __DEV__ && console.timeEnd(`⏰ ${componentName} rendered in`)
      __DEV__ && console.groupEnd()

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

      console.debug("%c[Created]", LogStyles.light, this.constructor.name)
    }

    afterMount() {
      console.debug("%c[Mounted]", LogStyles.light, this.constructor.name)
    }

    beforeUnmount() {
      console.debug("%c[Unmounted]", LogStyles.light, this.constructor.name)
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
    BaseComponent,
    Component,
  }
})()
