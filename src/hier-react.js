const HierReact = (function () {
  const { parseString, PLACEHOLDER } = HierParser
  const toReactElement = (element) => {
    if (Array.isArray(element)) element = element.shift()
    if (typeof element.$$typeof === "symbol" && element.hasOwnProperty("_owner")) return element

    if (element.tagName === "textString") return element.props.value || null

    let children = []
    if (element.children && Array.isArray(element.children) && element.children.length) {
      children = element.children.map((child) => toReactElement(child))
    }

    return React.createElement(element.tagName, element.props, children)
  }

  const react = (splits, ...values) => {
    const ast = parseString(splits.join(PLACEHOLDER), values)
    return toReactElement(ast)
  }

  return { react }
})()
