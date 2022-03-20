/**
 * @param {Function} callable
 * @returns {string[]}
 */
const getFunctionParamNames = (callable) => {
  if (typeof callable !== "function") throw new Error("Specified argument is not a function.")

  const renderFuncSign = callable.toString()
  const match = renderFuncSign.match(/^(?:function\s*)?\((.*)\)/)

  if (!match) return []

  const paramsString = match[1].trim()
  const paramsList = paramsString.split(/,\s*/)
  return paramsList.reduce((res, item) => {
    const match = item.match(/^\w+\b/)
    if (match) {
      res.push(match[0])
    }
    return res
  }, [])
}

class Reaction {
  /**
   * @param {Function} component
   * @param {HTMLElement} rootNode
   */
  static render(component, rootNode) {
    if (!(rootNode instanceof HTMLElement)) {
      throw new Error("Please specify correct rootNode.")
    }

    let componentToRender

    if (typeof component === "function") {
      componentToRender = new ReactionComponent()
      componentToRender.render = component
    } else {
      throw new Error("Not implemented yet.")
    }

    if (!(componentToRender instanceof ReactionComponent)) throw new Error("Fail to render component.")

    const components = this._astToComponentsList(componentToRender.render())
    this._appendComponents(components, rootNode)
  }

  /**
   * @param {Token[]|ReactionComponent[]} componentsList
   * @param {HTMLElement} rootNode
   */
  static _appendComponents(componentsList, rootNode) {
    componentsList.map((component) => {
      if (component instanceof ReactionComponent) {
        /**
         * Render Reaction component
         */
        let rendered

        const paramNames = getFunctionParamNames(component.render)
        if (paramNames.includes("props")) {
          /** If render function require props object */
          rendered = component.render(component.props || {})
        } else {
          rendered = component.render()
        }

        if (rendered) {
          if (!(rendered instanceof HTMLElement)) {
            rendered = document.createTextNode(rendered)
          }

          /** Append children to rendered html element */
          const children = component.props.children
          delete component.props.children
          if (children && Array.isArray(children)) {
            if (rendered instanceof Text) {
              const textWrapper = document.createElement("div")
              textWrapper.appendChild(rendered)
              rendered = textWrapper
            }

            mapPropsToElement(rendered, component.props)
            this._appendComponents(children, rendered)
          }

          rootNode.appendChild(rendered)
        }
      } else if (component instanceof Token) {
        /**
         * HTMLElement append to root node
         */
        const children = component.children || []
        component.children = []
        const element = createDomElement(component)
        rootNode.appendChild(element)

        if (children.length) {
          this._appendComponents(children, element)
        }
      }
    })
  }

  /**
   * @param {Token[]} ast
   * @returns {ReactionComponent[]}
   */
  static _astToComponentsList(ast) {
    const componentsTree = []

    const proceedToken = (token) => {
      if (token instanceof TokenElement) {
        let children
        if (token.children.length) {
          children = token.children.map((child, index) => {
            const _proceeded = proceedToken(child)
            /** Replace Token to ReactionComponent */
            token.children[index] = _proceeded
            return _proceeded
          })
        }

        const tokenName = token.name

        if (/[A-Z]/.test(tokenName[0])) {
          const tokenEval = eval(tokenName)

          /**
           * We found our component or function-component
           */
          let component
          if (typeof tokenEval === "function") {
            if (/^class *\w+.*{/.test(tokenEval)) {
              component = new tokenEval(token.props)
            } else {
              component = new ReactionComponent(token.props)
              component.render = tokenEval
            }
          }

          if (component) {
            if (children) {
              component.props.children = children
            }

            return component
          }
        }
      }

      return token
    }

    if (Array.isArray(ast)) {
      ast.map((token) => componentsTree.push(proceedToken(token)))
    } else {
      componentsTree.push(proceedToken(token))
    }

    return componentsTree
  }
}

/**
 * Base Reaction component
 */
class ReactionComponent {
  constructor(props) {
    if (props && typeof props !== "object") throw new Error("Please specify correct props object.")
    this.props = props || {}
  }

  render() {
    return null
  }
}
