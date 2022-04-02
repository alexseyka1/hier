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

      Hier._setNodeAttributes(element, attributes)

      if (children) {
        children.map((child) => {
          if (!child) return
          element.appendChild(child instanceof Node ? child : document.createTextNode(child))
        })
      }
      return element
    },

    _setNodeAttributes(node, attributes) {
      if (!Object.keys(attributes).length) return
      Object.entries(attributes || {}).map(([attribute, value]) => {
        if (/^on\w+/.test(attribute)) node[attribute.toLowerCase()] = value
        else {
          if (attribute === "className") attribute = "class"
          node.setAttribute(attribute, value)
        }
      })
    },

    createTextElement(value) {
      return document.createTextNode(value)
    },

    _createTextAstObject(value) {
      return { tagName: "text", props: { value } }
    },

    _mountComponents(component) {
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
     * Renders component object
     * @param {Function|BaseComponent} className
     * @param {Node} rootNode HTML node for appending component
     * @param {object} props properties to pass to created component
     * @returns {BaseComponent} rendered component object
     */
    render(className, rootNode, props) {
      const componentName = className instanceof BaseComponent ? className.constructor.name : className.name
      __DEV__ && console.group(`%c[Render][${componentName}]`, LogStyles.light)
      __DEV__ && console.time(`⏰ ${componentName} rendered in`)

      let component = className instanceof BaseComponent ? className : new className(props)

      const ast = component.render()
      __DEV__ && console.debug(`%c[Rendered][${componentName}]`, LogStyles.success, component, ast)

      const renderAstObject = (object, node) => {
        if (typeof object.tagName === "string") {
          const elementNode = Hier.createElement(object.tagName, object.props)
          object.node = elementNode
          node.appendChild(elementNode)

          if (object.children) {
            object.children = Util.cloneObject(object.children).map((child) => renderAstObject(child, elementNode))
          }
          return object
        } else {
          /** Current object is a component */
          const props = Object.assign({}, Util.cloneObject(object.props), { children: object.children })
          const nestedComponent = Hier.render(object instanceof BaseComponent ? object : object.tagName, null, props)
          node.appendChild(nestedComponent.node)
          return nestedComponent
        }
      }

      component.children = ast.map((object) => renderAstObject(object, component.node))
      if (rootNode) {
        rootNode.appendChild(component.node)
        Hier._mountComponents(component)
      }

      __DEV__ && console.timeEnd(`⏰ ${componentName} rendered in`)
      __DEV__ && console.groupEnd()

      return component
    },

    rerenderComponent(component) {
      const newComponent = Util.cloneObject(component)

      const compareChildrenElements = (innerComponent, currentChildren, newChildren) => {
        __DEV__ &&
          console.log(
            "%c[Re-render triggered]",
            LogStyles.success,
            innerComponent,
            Util.cloneObject(currentChildren),
            Util.cloneObject(newChildren)
          )

        const maxChildrenCount = Math.max(currentChildren.length, newChildren.length)
        for (let index = 0; index < maxChildrenCount; index++) {
          const currentElement = currentChildren[index]
          const newElement = newChildren[index]

          if (!currentElement && !newElement) continue
          else if (!currentElement && newElement) {
            /**
             * [done] New element will be added
             */
            if (innerComponent instanceof BaseComponent) innerComponent.children.push(newElement)
            else innerComponent.children.push(newElement)

            innerComponent.node.appendChild(newElement.node)
            if (newElement instanceof BaseComponent) {
              __DEV__ && console.debug("%c + [New component added]", LogStyles.light, newElement)
              newElement.afterMount()
            } else {
              __DEV__ && console.debug("%c + [New element added]", LogStyles.light, newElement)
            }
          } else if (currentElement && !newElement) {
            /**
             * [done] Some element has been removed
             */
            if (currentElement instanceof BaseComponent) currentElement.beforeUnmount()
            if (innerComponent instanceof BaseComponent) innerComponent.children.pop()
            else innerComponent.children.pop()
            currentElement.node.remove()
            if (currentElement instanceof BaseComponent) {
              __DEV__ && console.debug("%c - [Component removed]", LogStyles.base, currentElement)
            } else {
              __DEV__ && console.debug("%c - [Element removed]", LogStyles.base, currentElement)
            }
          } else {
            /**
             * Element has been moved, replaced or unchanged
             */
            if (currentElement instanceof BaseComponent && newElement instanceof BaseComponent) {
              /** [done] Both elements are components */
              if (currentElement.constructor.name === newElement.constructor.name) {
                /** [done] Equal components */
                if (Util.jsonSerialize(currentElement.props) === Util.jsonSerialize(newElement.props)) {
                  __DEV__ &&
                    console.debug(
                      "%c = [Component is unchanged]",
                      LogStyles.light,
                      currentElement,
                      Util.cloneObject(currentElement.props),
                      Util.cloneObject(newElement.props)
                    )
                } else {
                  __DEV__ &&
                    console.debug(
                      "%c -> [Component props changed]",
                      LogStyles.base,
                      Util.cloneObject(currentElement._props),
                      " -> ",
                      Util.cloneObject(newElement.props)
                    )

                  currentElement.props = Util.cloneObject(newElement.props)
                  /** Here the component must trigger its re-render */
                }
              } else {
                /** [done] Current component has been replaced by another one */
                __DEV__ &&
                  console.debug("%c <=> [Component replaced]", LogStyles.base, currentElement, " -> ", newElement)
                currentElement.beforeUnmount()

                if (innerComponent instanceof BaseComponent) innerComponent.children[index] = newElement
                else innerComponent.children[index] = newElement

                currentElement.node.replaceWith(newElement.node)
                newElement.afterMount()
              }
            } else if (currentElement.tagName === newElement.tagName) {
              /** Both elements are equal common HTML elements (tags) */
              if (Util.jsonSerialize(currentElement.props) !== Util.jsonSerialize(newElement.props)) {
                if (currentElement.tagName === "text") {
                  /** [done] If both elements are text strings */
                  currentElement.node.nodeValue = newElement.props.value
                  __DEV__ &&
                    console.debug(
                      "%c <T> [Text changed]",
                      LogStyles.warning,
                      Util.cloneObject(currentElement),
                      " -> ",
                      Util.cloneObject(newElement)
                    )
                } else {
                  Hier._setNodeAttributes(currentElement.node, Util.getElementAttributes(newElement.node))
                  __DEV__ &&
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
              }

              if (currentElement.children || newElement.children) {
                __DEV__ &&
                  console.log(
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
              __DEV__ &&
                console.debug("%c <-> [Element replaced by component]", LogStyles.warning, currentElement, newElement)
              if (innerComponent instanceof BaseComponent) innerComponent.children[index] = newElement
              else innerComponent.children[index] = newElement

              currentElement.node.replaceWith(newElement.node)
              newElement.afterMount()
            } else if (currentElement instanceof BaseComponent && !(newElement instanceof BaseComponent)) {
              /** [done] Component has been replaced by common HTML tag */
              __DEV__ &&
                console.debug("%c <-> [Component replaced by element]", LogStyles.warning, currentElement, newElement)
              currentElement.beforeUnmount()
              if (innerComponent instanceof BaseComponent) innerComponent.children[index] = newElement
              else innerComponent.children[index] = newElement

              currentElement.node.replaceWith(newElement.node)
            } else {
              console.debug("%c ??? [Unknown option]", LogStyles.warning, currentElement, newElement)
            }
          }
        }
      }

      const _currentChildren = component.children || []
      const _newComponentRendered = Hier.render(newComponent)
      const _newChildren = _newComponentRendered.children || []

      compareChildrenElements(component, _currentChildren, _newChildren)
    },
  }

  const Util = {
    /**
     * Convert component props (or any other object) to JSON.
     * Replaces BaseComponent instances to string
     * @param {*} obj
     * @returns
     */
    jsonSerialize: function (obj, prettyPrint) {
      return JSON.stringify(obj, null, prettyPrint ? 2 : 0)
    },
    /**
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
        newObj = obj.cloneNode(true)
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
    children = []
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
          __DEBUG__ &&
            console.debug(
              `[Props changed] [${this.constructor.name}]`,
              LogStyles.light,
              "from:",
              prevProps,
              `to:`,
              currentValue
            )
          Hier.rerenderComponent(this)
        },
      })

      /** Create component root node for mounting */
      this.node = Hier.createElement("main", { "data-component": this.constructor.name })
      // this.node = document.createDocumentFragment()
    }

    afterCreated() {
      __DEBUG__ && console.debug("%c[Created]", LogStyles.light, this.constructor.name)
    }

    afterMount() {
      __DEBUG__ && console.debug("%c[Mounted]", LogStyles.light, this.constructor.name)
    }

    beforeUnmount() {
      __DEBUG__ && console.debug("%c[Unmounted]", LogStyles.light, this.constructor.name)
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
          __DEBUG__ &&
            console.log(
              `%c[State changed] [${this.constructor.name}]`,
              LogStyles.light,
              "from:",
              prevState,
              `to:`,
              currentValue
            )
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
