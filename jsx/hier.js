const Hier = (function () {
  const EVENT_RERENDER = "rerender"
  const defaultLogStyles = ["color: #fff", "background-color: #444", "padding: 2px 4px", "border-radius: 2px"]
  const LogStyles = {
    base: defaultLogStyles.join(";"),
    warning: [...defaultLogStyles, "color: #eee", "background-color: red"].join(";"),
    success: [...defaultLogStyles, "background-color: green"].join(";"),
  }

  /**
   * HIER RENDERER
   */
  const Hier = {
    createElement(tagName, attributes, children) {
      if (tagName === "text") return document.createTextNode(attributes.value)
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
            hierComponent.parent = parentComponent

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

    /**
     * Renders root application component
     * @param {*} className
     * @param {*} rootNode
     */
    render(className, rootNode) {
      console.time("Application rendering")
      console.groupCollapsed(`[Application rendering] [${className.name}]`)
      const rootComponent = Hier._innerRender(className)
      /** Mounting rendered component HTML to root node */
      if (rootNode && rootNode instanceof Node) rootNode.appendChild(rootComponent.node)

      /** Mounting nested components */
      Hier._mountComponents(rootComponent)

      console.groupEnd()
      console.timeEnd("Application rendering")
      return rootComponent.node
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

      /** Mounting component to DOM root node */
      /** Removing unnecessary nested tags */
      while (component.node.childNodes.length === 1 && !(component.node.childNodes[0] instanceof Text)) {
        const tempNode = component.node.childNodes[0]
        component.node.remove()
        component.node = tempNode
      }

      if (!component.node.$$component) component.node.$$component = component
      return component
    },

    rerenderComponent(component) {
      console.time(`[Re-render time] [${component.constructor.name}]`)
      console.group(
        `%c[RERENDER]`,
        LogStyles.warning,
        `[${component.constructor.name}] props:`,
        component.props,
        ", state:",
        component.state
      )

      const clonedProps = Util.cloneObject(component.props)
      const newComponent = new component.constructor(clonedProps)
      newComponent._state = Util.cloneObject(component._state)

      const renderedAst = newComponent.render()

      // const _renderedAst = Hier.createHierComponents(renderedAst, newComponent)
      // /** FIX ? */
      // _renderedAst.map((item) => Hier._createElementFromAstObject(item))

      if (!component.props.hasOwnProperty("children")) component.props.children = []
      const currentChildrenCount = component.props.children.length
      const newChildrenCount = renderedAst.length

      const maxElementsCount = Math.max(currentChildrenCount, newChildrenCount)
      console.log({ renderedAst, props: component.props, maxElementsCount })
      if (!maxElementsCount) return

      for (let index = 0; index < maxElementsCount; index++) {
        const currentElement = component.props.children[index]
        const newElementAst = renderedAst[index]

        if (!currentElement && !newElementAst) continue
        else if (!currentElement && newElementAst) {
          /** New element must be added to the end */
          console.log("%c[New element must be added]", LogStyles.success, newElementAst)
          let _ast = Hier.createHierComponents([newElementAst])[0]
          if (typeof newElementAst === "string") _ast = Hier._createTextAstObject(newElementAst)

          const _newElement = Hier._createElementFromAstObject(_ast)
          component.props.children.push(_ast)
          component.node.appendChild(_newElement)
        } else if (currentElement && !newElementAst) {
          /** Element must be removed from the end */
          console.log("%c[Element must be removed]", LogStyles.warning, currentElement)
          if (currentElement instanceof BaseComponent) currentElement.beforeUnmount()
          currentElement.node.remove()
          component.props.children.pop()
        } else {
          console.log("%c[Element may be changed]", LogStyles.base, currentElement, newElementAst)
          /**
           * Element may be replaced, moved or unchanged
           */

          if (currentElement instanceof BaseComponent) {
            /** Current element is a component */

            if (typeof newElementAst.tagName === "function") {
              if (currentElement.constructor.name === newElementAst.tagName.name) {
                currentElement.props = Object.assign({}, currentElement.props, Util.cloneObject(newElementAst.props))
              } else {
                console.warn("We must replace component with the new one")
              }
            } else {
              /** Let's replace current component with a tag obect */
              const _ast = typeof newElementAst === "string" ? Hier._createTextAstObject(newElementAst) : newElementAst
              const _newElement = Hier._createElementFromAstObject(_ast)
              currentElement.beforeUnmount()
              currentElement.node.replaceWith(_newElement)
              component.props.children[index] = _ast
            }
          } else {
            /** Current element is NOT a component, it is a object */

            if (typeof newElementAst === "string") {
              if (currentElement.tagName === "text") {
                /** Change text value */
                currentElement.props.value = newElementAst
                currentElement.node.nodeValue = newElementAst
              } else {
                /** Let's replace current object with a text */
                const _ast = Hier._createTextAstObject(newElementAst)
                const _newElement = Hier._createElementFromAstObject(_ast)
                currentElement.node.replaceWith(_newElement)
                component.props.children[index] = _ast
              }
            } else {
              /** New lement is an object and it is not a text */
              currentElement.props = Object.assign({}, currentElement.props, Util.cloneObject(newElementAst.props))
              Object.entries(newElementAst.props).map(([attr, value]) => {
                if (/^on\w+/.test(attr)) return
                currentElement.node.setAttribute(attr === "className" ? "class" : attr, value)
              })

              if (currentElement.children || newElementAst.children) {
                /** Now we must to iterate an object children */
                console.log(
                  "%c[Now we must to iterate an object children]",
                  LogStyles.success,
                  currentElement,
                  newElementAst
                )

                Hier._iterateAstObjectChildren(
                  currentElement,
                  currentElement.children || [],
                  newElementAst.children || []
                )
              }
            }
          }
        }
      }

      console.groupEnd()
      console.timeEnd(`[Re-render time] [${component.constructor.name}]`)
    },

    /**
     * @param {object} elementWrapper
     * @param {object[]|string[]} currentElements
     * @param {object[]|string[]} newElements
     */
    _iterateAstObjectChildren(elementWrapper, currentElements, newElements) {
      const maxElementsCount = Math.max(currentElements.length, newElements.length)
      for (let _index = 0; _index < maxElementsCount; _index++) {
        const currentElement = currentElements[_index]
        const newElement = newElements[_index]

        if (!currentElement && !newElement) continue
        else if (!currentElement && newElement) {
          /** New NESTED element must be added */
          console.log("%c[New NESTED element must be added]", LogStyles.base, newElement)
          if (typeof newElement.tagName === "function" && Util.getIsClass(newElement.tagName)) {
            /** New component must be added to element children list */
          } else {
            /** New element must be added */
            let ast = newNestedElementAst
            if (typeof newNestedElementAst === "string") Hier._createTextAstObject(newNestedElementAst)

            const _newElement = Hier._createElementFromAstObject(ast)
            elementWrapper.children.push(ast)
            elementWrapper.node.appendChild(_newElement)
          }
        } else if (currentElement && !newElement) {
          /** NESTED element must be removed */
          console.log("%c[NESTED element must be removed]", LogStyles.base, currentElement)
          if (currentElement instanceof BaseComponent) currentElement.beforeUnmount()
          currentElement.node.remove()
          elementWrapper.children.pop()
        } else {
          /** Nested element may be replaced, moved or unchanged */
          console.log("%c[Nested Element may be changed]", LogStyles.base, currentElement, newElement)

          if (currentElement instanceof BaseComponent) {
            /** Current element is a component */

            if (typeof newElement.tagName === "function") {
              if (currentElement.constructor.name === newElement.tagName.name) {
                currentElement.props = Object.assign({}, currentElement.props, Util.cloneObject(newElement.props))
              } else {
                console.warn("We must replace component with the new one")
              }
            } else {
              console.log("I AM HERE 1", currentElement, newElement)
              /** Let's replace current component with a tag obect */
              // const _ast = typeof newElement === "string" ? Hier._createTextAstObject(newElement) : newElement
              // const _newElement = Hier._createElementFromAstObject(_ast)
              // currentElement.beforeUnmount()
              // currentElement.node.replaceWith(_newElement)
              // component.props.children[index] = _ast
            }
          } else {
            /** Current element is NOT a component, it is a object */

            if (typeof newElement === "string") {
              if (currentElement.tagName === "text") {
                /** Change text value */
                currentElement.props.value = newElement
                currentElement.node.nodeValue = newElement
              } else {
                /** Let's replace current object with a text */
                const _ast = Hier._createTextAstObject(newElement)
                const _newElement = Hier._createElementFromAstObject(_ast)
                currentElement.node.replaceWith(_newElement)
                elementWrapper.children[index] = _ast
              }
            } else {
              /** New lement is an object and it is not a text */
              currentElement.props = Object.assign({}, currentElement.props, Util.cloneObject(newElement.props))
              Object.entries(newElement.props).map(([attr, value]) => {
                if (/^on\w+/.test(attr)) return
                currentElement.node.setAttribute(attr === "className" ? "class" : attr, value)
              })

              if (currentElement.children || newElement.children) {
                /** Now we must to iterate an object children */
                Hier._iterateAstObjectChildren(currentElement, currentElement.children || [], newElement.children || [])
              }
            }
          }
        }
      }
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
    render: Hier.render,
    html: HierParser.ast,
    BaseComponent,
    Component,
  }
})()
