const Hier = (function () {
  const isDev = () => typeof __DEV__ !== "undefined" && __DEV__ === true
  const isDebug = () => typeof __DEBUG__ !== "undefined" && __DEBUG__ === true

  /**
   * Utility for setting function arguments required
   */
  function isRequired() {
    throw new Error("Required function argument not specified.")
  }
  /**
   * Resets specified variables and frees memory
   * @param  {...any} values
   */
  function free(...values) {
    values.map((item) => (item = null))
  }
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
   * Hier renderer
   */
  const Hier = {
    /**
     * Renders AST object to a specified HTML node
     * @param {string} tagName
     * @param {object} attributes tag attributes (properties) object
     * @param {string|object[]} children Text string or array of AST objects
     * @returns {HTMLElement|Text}
     */
    createElement(tagName = isRequired(), attributes, children) {
      if (tagName === "text") return document.createTextNode(attributes.value)
      const element = document.createElement(tagName)

      if (typeof attributes === "object") Hier._setNodeAttributes(element, attributes)

      if (children) {
        children.map((child) => {
          if (!child) return
          element.appendChild(child instanceof Node ? child : document.createTextNode(child))
        })
      }
      return element
    },

    /**
     * Deletes specified HTML node and all its children
     * @param {Node} node
     */
    _deleteUnnecessaryNode(node = isRequired()) {
      if (node.hasChildNodes()) {
        node.childNodes.forEach((child) => Hier._deleteUnnecessaryNode(child))
      }
      node.remove()
    },

    /**
     * Set HTML node attributes, specified by key-value object
     * @param {Node} node
     * @param {object} attributes
     */
    _setNodeAttributes(node = isRequired(), attributes = isRequired()) {
      if (!Object.keys(attributes).length) return
      Object.entries(attributes || {}).map(([attribute, value]) => {
        if (typeof value !== "string" && typeof value !== "function") return
        if (/^on\w+/.test(attribute)) node[attribute.toLowerCase()] = value
        else {
          if (attribute === "className") attribute = "class"
          node.setAttribute(attribute, value)
        }
      })
    },

    /**
     * Calls afterMount() method for specified component and all his children components
     * @param {BaseComponent} component
     */
    _mountComponents(component = isRequired()) {
      if (component instanceof BaseComponent) {
        component.afterMount()

        if (component.children && Array.isArray(component.children)) {
          component.children.map(Hier._mountComponents)
        }
      } else if (component.children && Array.isArray(component.children)) {
        component.children.map(Hier._mountComponents)
      }
    },
    /**
     * Renders AST object to specified HTML node or component
     * @param {object} object
     * @param {Node} node
     * @returns {Node|BaseComponent}
     */
    _renderAstObject(object = isRequired(), node = isRequired(), rootNode) {
      if (Array.isArray(object) && object.length === 1) object = object.pop()

      if (typeof object !== "object") {
        const elementNode = Hier.createElement("text", { value: object })
        node.appendChild(elementNode)
        /** Free memory */
        free(elementNode)
        return object
      } else if (typeof object.tagName === "string") {
        /** Current object is a common HTML element */
        object.node = Hier.createElement(object.tagName, object.props)
        node.appendChild(object.node)

        if (object.children) {
          object.children = Util.cloneObject(object.children).map((child) => Hier._renderAstObject(child, object.node))
        }

        return object
      } else {
        /** Current object is a component */
        const props = Object.assign({}, Util.cloneObject(object.props), { children: object.children })
        const nestedComponent = Hier.render(object instanceof BaseComponent ? object : object.tagName, null, props)
        if (rootNode) nestedComponent.afterCreated()
        node.appendChild(nestedComponent.node)
        return nestedComponent
      }
    },

    /**
     * Renders component object
     * @param {Function|BaseComponent} className
     * @param {Node} rootNode HTML node for appending component
     * @param {object} props properties to pass to created component
     * @returns {BaseComponent} rendered component object
     */
    render(className = isRequired(), rootNode, props) {
      const componentName = className instanceof BaseComponent ? className.constructor.name : className.name
      isDev() && console.group(`%c[Render][${componentName}]`, LogStyles.light)
      isDev() && console.time(`⏰ ${componentName} rendered in`)

      let component
      if (className instanceof BaseComponent) component = className
      else {
        component = new className(props)
        if (rootNode) component.afterCreated()
      }

      const ast = component.render()
      if (!ast) return component
      isDev() && console.debug(`%c[Rendered][${componentName}]`, LogStyles.success, component, ast)

      component.children = ast.map((object) => Hier._renderAstObject(object, component.node, rootNode))
      if (rootNode) {
        rootNode.appendChild(component.node)
        Hier._mountComponents(component)
      }

      isDev() && console.timeEnd(`⏰ ${componentName} rendered in`)
      isDev() && console.groupEnd()

      /** Free memory */
      free(componentName, ast)
      return component
    },

    /**
     * Re-renders specified component. Updates only changed parts of component content
     * @param {BaseComponent} component
     */
    rerenderComponent(component = isRequired()) {
      /**
       * Component content reconcillation process. Finds out changed parts and renders it to DOM
       * @param {BaseComponent|object} innerComponent Hier component or common tag AST object
       * @param {BaseComponent[]|object[]} currentChildren
       * @param {BaseComponent[]|object[]} newChildren
       */
      const compareChildrenElements = (innerComponent = isRequired(), currentChildren, newChildren) => {
        isDev() &&
          console.debug(
            "%c[Re-render triggered]",
            LogStyles.success,
            innerComponent,
            Util.cloneObject(currentChildren),
            Util.cloneObject(newChildren)
          )
        if (typeof innerComponent.children === "undefined") innerComponent.children = []
        if (typeof currentChildren === "undefined") currentChildren = []
        if (typeof newChildren === "undefined") newChildren = []

        const maxChildrenCount = Math.max(currentChildren.length, newChildren.length)
        for (let index = 0; index < maxChildrenCount; index++) {
          const currentElement = currentChildren[index]
          const newElement = newChildren[index]

          if (!currentElement && !newElement) continue
          else if (!currentElement && newElement) {
            /**
             * [done] New element will be added
             */
            innerComponent.children.push(newElement)

            innerComponent.node.appendChild(newElement.node)
            if (newElement instanceof BaseComponent) {
              isDev() && console.debug("%c + [New component added]", LogStyles.light, newElement)
              newElement.afterMount()
            } else {
              isDev() && console.debug("%c + [New element added]", LogStyles.light, newElement)
            }
          } else if (currentElement && !newElement) {
            /**
             * [done] Some element has been removed
             */
            if (currentElement instanceof BaseComponent) {
              currentElement.beforeUnmount()
              /** Free memory */
              Hier._deleteUnnecessaryNode(currentElement.node)
              free(currentElement.node)
            }
            innerComponent.children.pop()
            /** Free memory */
            Hier._deleteUnnecessaryNode(currentElement.node)
            free(currentElement.node, currentElement)
            if (currentElement instanceof BaseComponent) {
              isDev() && console.debug("%c - [Component removed]", LogStyles.base, currentElement)
            } else {
              isDev() && console.debug("%c - [Element removed]", LogStyles.base, currentElement)
            }
          } else {
            /**
             * [done] Element has been moved, replaced or unchanged
             */
            if (currentElement instanceof BaseComponent && newElement instanceof BaseComponent) {
              /** [done] Both elements are components */
              if (currentElement.constructor.name === newElement.constructor.name) {
                /** [done] Equal components */
                if (Util.jsonSerialize(currentElement.props) === Util.jsonSerialize(newElement.props)) {
                  isDev() &&
                    console.debug(
                      "%c = [Component is unchanged]",
                      LogStyles.light,
                      currentElement,
                      Util.cloneObject(currentElement.props),
                      Util.cloneObject(newElement.props)
                    )
                } else {
                  isDev() &&
                    console.debug(
                      "%c -> [Component props changed]",
                      LogStyles.base,
                      Util.cloneObject(currentElement._props),
                      " -> ",
                      Util.cloneObject(newElement.props)
                    )

                  currentElement.props = Util.cloneObject(newElement.props)
                  /** Here the component must trigger its re-render */
                  /** Free memory */
                  Hier._deleteUnnecessaryNode(newElement.node)
                  free(newElement.node, newElement)
                }
              } else {
                /** [done] Current component has been replaced by another one */
                isDev() &&
                  console.debug("%c <=> [Component replaced]", LogStyles.base, currentElement, " -> ", newElement)
                currentElement.beforeUnmount()

                innerComponent.children[index] = newElement

                currentElement.node.replaceWith(newElement.node)
                newElement.afterMount()
                /** Free memory */
                Hier._deleteUnnecessaryNode(currentElement.node)
                free(currentElement.node)
              }
            } else if (currentElement.tagName === newElement.tagName) {
              /** [done] Both elements are equal common HTML elements (tags) */
              if (Util.jsonSerialize(currentElement.props) !== Util.jsonSerialize(newElement.props)) {
                if (currentElement.tagName === "text") {
                  /** [done] If both elements are text strings */
                  currentElement.node.nodeValue = newElement.props.value
                  isDev() &&
                    console.debug(
                      "%c <T> [Text changed]",
                      LogStyles.warning,
                      Util.cloneObject(currentElement),
                      " -> ",
                      Util.cloneObject(newElement)
                    )
                } else {
                  Hier._setNodeAttributes(currentElement.node, Util.getElementAttributes(newElement.node))
                  isDev() &&
                    console.debug(
                      "%c <-> [Tag attributes replaced]",
                      LogStyles.warning,
                      Util.cloneObject(currentElement.props),
                      " -> ",
                      Util.cloneObject(newElement.props)
                    )
                }
                currentElement.props = Util.cloneObject(newElement.props)
                if (currentChildren.node) {
                  Hier._setNodeAttributes(currentChildren.node, newElement.props)
                }

                /** Free memory */
                Hier._deleteUnnecessaryNode(newElement.node)
                free(newElement.node, newElement)
              }

              if (currentElement.children || newElement.children) {
                isDev() &&
                  console.debug(
                    "%c[Now we must iterate element children]",
                    LogStyles.light,
                    innerComponent,
                    currentElement,
                    newElement
                  )
                compareChildrenElements(currentElement, currentElement.children, newElement.children)
              }
            } else if (!(currentElement instanceof BaseComponent) && newElement instanceof BaseComponent) {
              /** [done] Common HTML element has been replaced by component */
              isDev() &&
                console.debug("%c <-> [Element replaced by component]", LogStyles.warning, currentElement, newElement)
              innerComponent.children[index] = newElement
              currentElement.node.replaceWith(newElement.node)
              newElement.afterMount()
              /** Free memory */
              Hier._deleteUnnecessaryNode(currentElement.node)
              free(currentElement.node)
            } else if (currentElement instanceof BaseComponent && !(newElement instanceof BaseComponent)) {
              /** [done] Component has been replaced by common HTML tag */
              isDev() &&
                console.debug("%c <-> [Component replaced by element]", LogStyles.warning, currentElement, newElement)
              currentElement.beforeUnmount()
              innerComponent.children[index] = newElement
              currentElement.node.replaceWith(newElement.node)
              // /** Free memory */
              Hier._deleteUnnecessaryNode(currentElement.node)
              free(currentElement.node)
            } else if (
              !(currentElement instanceof BaseComponent) &&
              !(newElement instanceof BaseComponent) &&
              currentElement.tagName !== newElement.tagName
            ) {
              /** Different elements specified */
              isDev() &&
                console.debug("%c <-> [Element replaced by another one]", LogStyles.warning, currentElement, newElement)
              innerComponent.children[index] = newElement

              currentElement.node.replaceWith(newElement.node)
              /** Free memory */
              Hier._deleteUnnecessaryNode(currentElement.node)
              free(currentElement.node)
            } else {
              console.debug("%c ??? [Unknown option]", LogStyles.warning, currentElement, newElement)
            }
          }

          /** Free memory */
          free(currentElement, newElement, index)
        }
      }

      const ast = component.render()
      const _currentChildren = component.children || []
      const tempNode = Hier.createElement("main")
      const _newChildren = ast.map((object) => Hier._renderAstObject(object, tempNode))

      compareChildrenElements(component, _currentChildren, _newChildren)
      console.log(component, tempNode)
      /** Free memory */
      free(ast, _currentChildren, _newChildren, tempNode)
    },
  }

  /**
   * Inner utilities
   */
  const Util = {
    /**
     * Convert component props (or any other object) to JSON.
     * Replaces BaseComponent instances to string
     * @param {any} obj
     * @returns {string}
     */
    jsonSerialize: function (obj = isRequired(), prettyPrint) {
      return JSON.stringify(obj, null, prettyPrint ? 2 : 0)
    },
    /**
     * Depp clone any object
     * @param {object} obj
     * @returns {object}
     */
    cloneObject: function (obj) {
      let newObj
      if (obj instanceof BaseComponent) {
        const clonedProps = Util.cloneObject(obj.props)
        const newComponent = new obj.constructor(clonedProps)
        newComponent._state = obj._state || {}
        newObj = newComponent
      } else if (obj instanceof Node) {
        newObj = obj.cloneNode()
      } else {
        newObj = Object.assign({}, obj || {})
      }

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
     * Finds out is function class or not
     * @param {Function} callable
     * @returns {boolean}
     */
    getIsClass: function (callable = isRequired()) {
      if (typeof callable !== "function") return false
      return /^class *\w+.*{/.test(callable)
    },

    /**
     * Returns specified HTML node attributes
     * @param {HTMLElement} element
     * @throws {TypeError}
     * @returns {object} Element attributes
     */
    getElementAttributes: function (element = isRequired()) {
      if (!(element instanceof HTMLElement)) throw new TypeError("Invalid object specified.")
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
   * Hier components
   */
  class BaseComponent {
    _props = {}
    props = {}
    children = []
    node = null

    /**
     * @constructor
     * @param {object} props key-value properties object
     * @throws {TypeError}
     */
    constructor(props) {
      if (props && typeof props !== "object") throw new TypeError("Please specify correct props object.")
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
          const prevProps = Util.cloneObject(this._props)
          if (Util.jsonSerialize(prevProps) === Util.jsonSerialize(currentValue)) {
            isDev() && console.debug(`[Props didn't changed] [${this.constructor.name}]`)
            return
          }

          this._props = currentValue
          this.afterUpdate(currentValue, prevProps)
          Hier.rerenderComponent(this)
        },
      })

      /** Create component root node for mounting */
      this.node = Hier.createElement("main", Object.assign({ "data-component": this.constructor.name }, props))
    }

    afterCreated() {
      isDebug() && console.debug(`⭐️ %c[Created] [${this.constructor.name}]`, LogStyles.light)
    }

    afterMount() {
      isDebug() && console.debug(`✅ %c[Mounted] [${this.constructor.name}]`, LogStyles.light)
    }

    beforeUnmount() {
      isDebug() && console.debug(`⛔️ %c[Unmounted] [${this.constructor.name}]`, LogStyles.light)
    }

    afterUpdate(props, prevProps) {
      isDebug() && console.debug(`🔄 %c[Updated] [${this.constructor.name}]`, LogStyles.light, { props, prevProps })
    }

    /**
     * @inner
     * @param {string} attr
     * @param {any} defaultValue
     */
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
          const prevState = Util.cloneObject(this._state)
          this._state = currentValue
          this.afterUpdate(this._props, this._props, currentValue, prevState)
          Hier.rerenderComponent(this)
        },
      })
    }

    afterUpdate(props, prevProps, state, prevState) {
      isDebug() &&
        console.debug(`🔄 %c[Updated] [${this.constructor.name}]`, LogStyles.light, {
          props,
          prevProps,
          state,
          prevState,
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
