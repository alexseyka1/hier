const PLACEHOLDER = `___PLACEHOLDER_${Date.now()}___`
const TYPES = {
  element: "element",
  value: "value",
  props: "props",
}

const jsx = (splits, ...values) => {
  /** Get root AST */
  const root = parseElement(splits.join(PLACEHOLDER), values)

  console.log(root)

  return createDomElement(root)
}

const createDomElement = (node) => {
  if (node.type === TYPES.value) {
    return node.value
  }

  const element = document.createElement(node.tag)
  mapPropsToElement(element, node.props.props)

  if (node.children.length) {
    node.children.map((child) => {
      let childElement = createDomElement(child)
      if (typeof childElement === "string") {
        childElement = document.createTextNode(childElement)
      }

      element.appendChild(childElement)
    })
  }

  return element
}

const mapPropsToElement = (element, props) => {
  if (!props || typeof props !== "object") return

  Object.entries(props).map(([prop, value]) => {
    if (prop == "class") prop = "className"
    element[prop] = value
  })
}

const parseElement = (str, values) => {
  let match, length

  const node = {
    type: TYPES.element,
    props: parseProps("", []),
    children: [],
    length: 0,
    name: "",
  }

  str = str.replace(/\s+/, " ").replace("\n", "").trim()

  /**
   * Let's try to find out the tag name
   */
  match = str.match(/<(\w+)/)
  console.log({ str, match })
  if (!match) {
    /** If tag opener was not found - the current code is a value */
    str = str.split("<")[0]

    return parseValues(str, values)
  }

  node.name = match[1]
  node.tag = node.name === PLACEHOLDER ? values.shift() : node.name
  length = match.index + match[0].length
  str = str.slice(length)
  node.length += length

  /**
   * Now let's find the tag closer
   */
  match = str.match(/>/)

  if (!match) return node

  node.props = parseProps(str.slice(0, match.index), values)
  length = node.props.length
  str = str.slice(length)
  node.length += length

  /**
   * Current element is self closing or not ?
   */
  match = str.match(/^ *\/ *>/)

  if (match) {
    node.length += match.index + match[0].length

    /** Return node if it is self closing */
    return node
  }

  match = str.match(/>/)

  if (!match) return node

  length = match.index + 1
  str = str.slice(length)
  node.length += length

  /**
   * Then let's parse children elements
   */
  let children = []
  const parseNextChildren = () => {
    children = [].concat(parseElement(str, values))
  }
  parseNextChildren()

  while (children.length) {
    children.forEach((child) => {
      length = child.length
      str = str.slice(length)
      node.length += length

      if (child.type !== TYPES.value || child.value) {
        node.children.push(child)
      }
    })

    parseNextChildren()
  }

  /**
   * Is there closing tag ?
   */
  match = str.match(new RegExp(`</${node.name}>`))

  if (!match) return node

  node.length += match.index + match[0].length

  /**
   * Checking closing tag matches opening tag
   */
  if (node.name === PLACEHOLDER) {
    const value = values.shift()
    if (value !== node.tag) return node
  }

  return node
}

const parseProps = (str, values) => {
  let match

  const node = {
    type: TYPES.props,
    length: 0,
    props: {},
  }

  const matchNextProp = () => {
    match =
      /** Double quote */
      str.match(/ \w+="(?:[^\\"])*"/) ||
      /** Single quote */
      str.match(/ \w+='(?:[^\\'])*'/) ||
      /** Placeholder */
      str.match(new RegExp(` *\\w+=${PLACEHOLDER}`)) ||
      /** Any other */
      str.match(/ *\w+/)
  }

  matchNextProp()

  while (match) {
    const propStr = match[0]
    let [key, ...value] = propStr.split("=")
    node.length += propStr.length
    key = key.trim()

    value = value.join("=")
    if (value === PLACEHOLDER) {
      value = values.shift()
    } else {
      value = value ? value.slice(1, -1) : true
    }

    node.props[key] = value
    str = str.slice(0, match.index) + str.slice(match.index + propStr.length)

    matchNextProp()
  }

  return node
}

const parseValues = (str, values) => {
  const nodes = []

  str.split(PLACEHOLDER).forEach((split, index, splits) => {
    let value, length

    value = split
    length = split.length
    str = str.slice(length)

    value = value.trim()

    if (length) {
      nodes.push({
        type: TYPES.value,
        length,
        value,
      })
    }

    if (index === splits.length - 1) return

    value = values.pop()
    length = PLACEHOLDER.length

    if (typeof value === "string") {
      value = value.trim()
    }

    nodes.push({
      type: TYPES.value,
      length,
      value,
    })
  })

  return nodes
}
