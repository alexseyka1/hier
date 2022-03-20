const PLACEHOLDER = `___PLACEHOLDER_${Date.now()}___`
const TYPES = {
  element: "element",
  value: "value",
}
const STATES = {
  data: "date",
  tagOpen: "tagOpen",
  tagName: "tagName",
  tagClose: "tagClose",
}

class Token {
  type = null
  constructor(type) {
    this.type = type
  }
}
class TokenElement extends Token {
  name = null
  props = null
  children = []
  constructor(name, props = null) {
    super(TYPES.element)
    this.name = name
    this.props = props
  }
}
class TokenValue extends Token {
  value = null
  constructor(value) {
    super(TYPES.value)
    this.value = value
  }
}

const ast = (splits, ...values) => {
  return parseString(splits.join(PLACEHOLDER), values)
}

const jsx = (splits, ...values) => {
  /** Get root AST */
  const root = parseString(splits.join(PLACEHOLDER), values)

  if (Array.isArray(root)) {
    const wrapper = createDomElement(new TokenElement("div"))
    root.map((item) => {
      wrapper.appendChild(createDomElement(item))
    })
    return wrapper
  } else {
    return createDomElement(root)
  }
}

const createDomElement = (node) => {
  if (node instanceof TokenValue) {
    return document.createTextNode(node.value)
  }

  const element = document.createElement(node.name)
  mapPropsToElement(element, node.props)

  if (node.children && Array.isArray(node.children) && node.children.length) {
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

const parseString = (str, values) => {
  const chars = str.split("")
  let state = STATES.data

  let charStack = [],
    tokensStack = [],
    openedTagsStack = []

  const insertElementToTree = (element) => {
    /** If we have an opened tag we must append new token to his children list */
    const lastOpenedTag = openedTagsStack[openedTagsStack.length - 1]
    if (lastOpenedTag) {
      lastOpenedTag.children.push(element)
    } else {
      tokensStack.push(element)
    }
  }

  chars.map((char, cursor) => {
    switch (state) {
      case STATES.data:
        /** Push characters to stack before meeting start tag symbol */
        if (char === "<") {
          /** Push new value-token to stack */
          if (charStack.length) {
            const value = parseValue(charStack.join("").trim(), values)
            if (value.length) {
              const valueToken = new TokenValue(value)
              insertElementToTree(valueToken)
            }
            charStack = []
          }
          state = STATES.tagName
        } else {
          charStack.push(char)
        }
        break

      case STATES.tagName:
        if ([">", " "].includes(char)) {
          /** Push new element-token to stack */
          if (charStack.length) {
            let tokenTagName = charStack.join("")
            if (tokenTagName === PLACEHOLDER) {
              tokenTagName = values.shift()
            }

            const elementToken = new TokenElement(tokenTagName)
            insertElementToTree(elementToken)
            openedTagsStack.push(elementToken)
            charStack = []
          }

          if (char === ">") {
            state = STATES.data
          } else if (char === " ") {
            state = STATES.tagOpen
          }
        } else if (char === "/") {
          /** Closing tag */
          state = STATES.tagClose
        } else {
          charStack.push(char)
        }
        break

      case STATES.tagOpen:
        if (char === ">") {
          /** Parse props */
          const lastOpenedTag = openedTagsStack[openedTagsStack.length - 1]
          lastOpenedTag.props = parseProps(charStack.join(""), values)
          charStack = []

          const prevChar = chars[cursor - 1]
          if (prevChar === "/") {
            openedTagsStack.pop()
          }

          state = STATES.data
        } else if (char === "/") {
          /** Self-closing tag */
        } else {
          charStack.push(char)
        }
        break

      case STATES.tagClose:
        if (char === ">") {
          openedTagsStack.pop()
          state = STATES.data
        }
        break
    }
  })

  return tokensStack
}

const parseProps = (str, values) => {
  str = " " + str.trim()
  let match

  const props = {}

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
    key = key.trim()

    value = value.join("=")
    if (value.match(new RegExp(`["']?${PLACEHOLDER}["']?`))) {
      value = values.shift()
    } else {
      value = value ? value.slice(1, -1) : true
    }

    if (key.startsWith("on")) key = key.toLowerCase()

    props[key] = value
    str = str.slice(0, match.index) + str.slice(match.index + propStr.length)

    matchNextProp()
  }

  return props
}

const parseValue = (str, values) => {
  while (str.match(new RegExp(PLACEHOLDER))) {
    value = values.shift()
    str = str.replace(new RegExp(PLACEHOLDER), value)
  }

  return str
}
