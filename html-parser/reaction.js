const Reaction = {
  EVENT_RERENDER: "rerender",

  /**
   * @param {Function} rootComponent
   * @param {HTMLElement} rootNode
   */
  render: function (rootComponent, rootNode) {
    if (!(rootNode instanceof HTMLElement)) throw new Error("Please specify correct rootNode.")

    let componentToRender
    if (typeof rootComponent === "function") {
      if (Util.getIsClass(rootComponent)) {
        componentToRender = new rootComponent()
      } else {
        componentToRender = new ReactionComponent()
        componentToRender.render = rootComponent
      }

      componentToRender.node = rootNode
    } else {
      throw new Error("Component must be function or class that extends ReactionComponent.")
    }

    if (!(componentToRender instanceof ReactionComponent)) throw new Error("Fail to render component.")

    const ast = componentToRender.render()
    const components = this._astToComponentsList(ast)
    componentToRender.children = this._attachComponents(components, componentToRender)

    // componentToRender.node.addEventListener(Reaction.EVENT_RERENDER, (e) => {
    //   // e.detail -> changed component
    //   this.reRender(componentToRender)
    // })
  },

  reRender: function (rootComponent) {
    console.log(rootComponent.render())
    rootComponent.children.map((child) => {})
  },

  /**
   * @param {Token[]} ast
   * @returns {ReactionComponent[]}
   */
  _astToComponentsList: function (ast) {
    const proceedToken = (token) => {
      let children
      if (token.children && Array.isArray(token.children) && token.children.length) {
        children = token.children.map((child, index) => {
          const _proceeded = proceedToken(child)
          /** Replace Token to ReactionComponent */
          token.children[index] = _proceeded
          return _proceeded
        })
      }

      const tokenName = token.name
      const props = Object.assign({}, token.props, children ? { children } : {})

      let component
      if (token instanceof TokenElement) {
        let tokenEval
        try {
          tokenEval = eval(tokenName)
        } catch (e) {}

        if (/[A-Z]/.test(tokenName[0]) && tokenEval && typeof tokenEval === "function") {
          /**
           * Reaction component or function-component
           */
          if (Util.getIsClass(tokenEval)) {
            component = new tokenEval(props)
          } else {
            component = new ReactionComponent(props)
            component.render = tokenEval
          }
        } else {
          /**
           * Structure tag
           */
          component = new ReactionComponent(props)
          component.render = () => {
            return jsx`<${token.name}></${token.name}>`
          }
        }
      } else if (token instanceof TokenValue) {
        /**
         * Just text
         */
        component = new ReactionComponent(token.props)
        component.render = () => token.value
      }

      return component || token
    }

    const componentsTree = []
    if (Array.isArray(ast)) {
      ast.map((token) => componentsTree.push(proceedToken(token)))
    } else {
      componentsTree.push(proceedToken(ast))
    }

    return componentsTree
  },

  /**
   * @param {Token[]|ReactionComponent[]} componentsList
   * @param {ReactionComponent} rootComponent
   */
  _renderComponents: function (componentsList) {
    return componentsList.map((component) => {
      let rendered = component.render.call(component, component.props || {})

      if (rendered) {
        /**
         * Checking for AST structures
         */
        if (rendered instanceof Token || (Array.isArray(rendered) && rendered.every((item) => item instanceof Token))) {
          const nestedComponents = this._astToComponentsList(rendered)
          component.props.children = [...(component.props.children || []), ...nestedComponents]
          rendered = ""
        }

        const children = component.props.children
        const hasChildren = children && Array.isArray(children)

        if (!(rendered instanceof HTMLElement)) {
          rendered = document.createTextNode(rendered)

          /** Wrapping text value to DOM element */
          if (hasChildren) {
            const textWrapper = document.createElement("div")
            textWrapper.appendChild(rendered)
            rendered = textWrapper
          }
        }

        /** Mapping tag attributes */
        mapPropsToElement(rendered, component.props)

        /** Render children to html elements */
        if (hasChildren) {
          component.props.children = this._renderComponents(component.props.children)
        }
      }

      return component
    })
  },

  /**
   * @param {Token[]|ReactionComponent[]} componentsList
   * @param {ReactionComponent} rootComponent
   */
  _attachComponents: function (componentsList, rootComponent) {
    if (!rootComponent || !rootComponent.node || !(rootComponent.node instanceof HTMLElement)) {
      throw new Error("Parent component was not attached to DOM.")
    }

    return componentsList.map((component) => {
      let rendered = component.render.call(component, component.props || {})

      if (rendered) {
        /**
         * Checking for AST structures
         */
        if (rendered instanceof Token || (Array.isArray(rendered) && rendered.every((item) => item instanceof Token))) {
          const nestedComponents = this._astToComponentsList(rendered)
          component.props.children = [...(component.props.children || []), ...nestedComponents]
          rendered = ""
        }

        const children = component.props.children
        const hasChildren = children && Array.isArray(children)

        if (!(rendered instanceof HTMLElement)) {
          rendered = document.createTextNode(rendered)

          /** Wrapping text value to DOM element */
          if (hasChildren) {
            const textWrapper = document.createElement("div")
            textWrapper.appendChild(rendered)
            rendered = textWrapper
          }
        }

        /** Mapping tag attributes */
        mapPropsToElement(rendered, component.props)

        /** Attach own component to DOM element */
        rootComponent.node.appendChild(rendered)
        component.node = rendered

        /** Append children to rendered html element */
        if (hasChildren) {
          // if (component.constructor.name === ReactionComponent.name) {
          component.children = this._attachComponents(children, component)
          // }
        }
      }

      return component
    })
  },
}

/**
 * Base Reaction component
 */
class BaseReactionComponent {
  _prevProps = {}
  _props = {}
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

class ReactionComponent extends BaseReactionComponent {
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

        this.node.dispatchEvent(new CustomEvent(Reaction.EVENT_RERENDER, { detail: this }))
      },
    })
  }

  /**
   * @param {object} obj
   */
  setState(obj) {
    const prevState = this.state,
      newState = Object.assign({}, prevState || {}, obj)

    const diff = Util.getObjectDiff(prevState, newState)
    if (!Object.keys(diff).length) return

    this.state = newState
  }
}
