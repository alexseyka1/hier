const Reaction = {
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
  },

  reRender: function (componentCaller) {
    return

    /**
     * First of all let's check children changed
     */
    let isChildrenChanged = false
    if (componentCaller.children && Array.isArray(componentCaller.children) && componentCaller.children.length) {
      for (let child of componentCaller.children) {
        isChildrenChanged |= this.reRender(child)
        if (isChildrenChanged) break
      }
    }
    if (isChildrenChanged) {
      componentCaller.node.innerHTML = ""
      this._attachComponents(componentCaller.children, componentCaller)
      return true
    }

    /**
     * Or this is a value token and it has been changed
     */
    if (componentCaller instanceof TokenValue) {
      console.log(componentCaller)
      if (
        componentCaller.node.data.length !== componentCaller.value.length ||
        componentCaller.node.data !== componentCaller.value
      ) {
        console.log(componentCaller)
        componentCaller.node.innerHTML = componentCaller.value
        return true
      }
    }

    /**
     * Or state\props have been changed
     */
    const propsDiff = Util.getObjectDiff(componentCaller._prevProps || {}, componentCaller.props || {})
    if (Object.values(propsDiff).length > 0) {
      console.log("Props changed:", componentCaller, propsDiff)
      return true
    } else {
      const stateDiff = Util.getObjectDiff(componentCaller._prevState || {}, componentCaller.state || {})
      if (Object.values(stateDiff).length > 0) {
        console.log("State changed:", componentCaller, stateDiff)
        return true
      }
    }

    // console.log(componentCaller, isChildrenChanged)
    return false
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
      let rendered

      const paramNames = Util.getFunctionParamNames(component.render)
      if (paramNames.includes("props")) {
        /** If render function require props object */
        rendered = component.render(component.props || {})
      } else {
        rendered = component.render()
      }

      if (rendered) {
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
          component.children = this._attachComponents(children, component)
        }
      }

      return component
    })
  },

  /**
   * @param {Token[]} ast
   * @returns {ReactionComponent[]}
   */
  _astToComponentsList: function (ast) {
    const componentsTree = []

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

    if (Array.isArray(ast)) {
      ast.map((token) => componentsTree.push(proceedToken(token)))
    } else {
      componentsTree.push(proceedToken(token))
    }

    return componentsTree
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

class TextReactionComponent extends BaseReactionComponent {}

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

        Reaction.reRender(this)
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
