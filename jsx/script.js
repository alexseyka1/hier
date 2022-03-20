"use strict"

const rendered = jsx`<div>
    <div>
      <SayHello name={"Dolly"} />
    </div>
    <div>My number is: {num}</div>
    <div>
      <button onClick={() => increment()}>Increment +</button>
      <button onClick={() => decrement()}>Decrement -</button>
    </div>
  </div>`

//////////////////////////////////////////////////////////////////////

// const createElement = (tag, _props, ...children) => {
//   let props = _props
//   // Object.entries(_props || {}).forEach(([name, _value]) => {
//   //   let value = _value
//   //   if (typeof value === "function") console.log({ value })
//   //   // element.setAttribute(name, value.toString())
//   //   // props[name] = value
//   // })

//   if (typeof tag === "function") return tag(props, children)

//   const element = document.createElement(tag),
//     appendChild = (parent, child) => {
//       if (Array.isArray(child)) {
//         child.forEach((nestedChild) => appendChild(parent, nestedChild))
//       } else {
//         parent.appendChild(child.nodeType ? child : document.createTextNode(child))
//       }
//     }

//   Object.entries(props || {}).forEach(([name, value]) => {
//     /** Let's handle element events  */
//     if (name.startsWith("on") && name.toLowerCase() in window) {
//       element.addEventListener(name.toLowerCase().substr(2), value)
//     } else {
//       element.setAttribute(name, value.toString())
//     }
//   })

//   children.forEach((child) => {
//     appendChild(element, child)
//   })

//   return element
// }

// const SayHello = (props) =>
//   jsx`<div>
//     <h3>Hello {props ? props.name : "world"}</h3>
//     <p>I hope you're having a good day</p>
//   </div>`

// const Test = (props) => {
//   let num = 0,
//     increment = () => {
//       console.log(`Increment: from ${num} to ${++num}`)
//     },
//     decrement = () => {
//       console.log(`Increment: from ${num} to ${--num}`)
//     }

//   const rendered = jsx`<div>
//     <div>
//       <SayHello name={"Dolly"} />
//     </div>
//     <div>My number is: {num}</div>
//     <div>
//       <button onClick={() => increment()}>Increment +</button>
//       <button onClick={() => decrement()}>Decrement -</button>
//     </div>
//   </div>`
//   return null
// }

// /* <Component /> === Component() */
// document.getElementById("app").appendChild(jsx`<Test />`)

////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////

// class MyReact {
//   _config = {
//     // el: string - app root element selector
//     // state: object, state object
//   }

//   constructor(config) {
//     /** Merge base config for sprcified config-object */
//     if (typeof config === "object") {
//       this._config = Object.assign(this._config, config)
//     }

//     this._init()

//     /** If app needs render method */
//     if (this.render && typeof this.render === "function") {
//       /** user must specify correct root element selector */
//       if (!this.el) throw new Error("Please specify `el` property for rendering the app.")

//       const stringToRender = this.render.call(),
//         renderedHtmlFragment = this._htmlToJs(stringToRender)

//       this.el.innerHTML = ""
//       this.el.appendChild(renderedHtmlFragment)
//     }
//   }

//   _init() {
//     /** Skip initialisaion */
//     if (!this._config || typeof this._config !== "object") return

//     if (this._config.el) {
//       this.el = document.querySelector(this._config.el)
//       delete this._config.el
//     }

//     /** Mapping config object to our app properties */
//     Object.entries(this._config).forEach(([peropertyName, value]) => {
//       Object.defineProperty(this, peropertyName, { value })
//     })
//     delete this._config
//   }

//   setState(object) {
//     if (!this.hasOwnProperty("state")) this.state = {}
//     if (typeof object !== "object") return
//     this.state = Object.assign(this.state, object)
//   }

//   _htmlToJs(html) {
//     var template = document.createElement("template")
//     html = html.trim()
//     template.innerHTML = html

//     const wrapper = document.createElement("div")
//     wrapper.innerHTML = html

//     const tree = []
//     for (let node of wrapper.children) {
//       tree.push(this._getElementsTree(node))
//     }
//     console.log({ tree })

//     return template.content
//   }

//   /**
//    * @param {Node} parentNode
//    */
//   _getElementsTree(parentNode) {
//     if (parentNode.children) {
//       for (let child of parentNode.children) {
//         this._getElementsTree(child)
//       }
//     }

//     if (parentNode.nodeName.toLowerCase() == "button") {
//       parentNode.addEventListener("click", (e) => {
//         console.log("Click to button")
//       })
//     }

//     return {}
//   }
// }

// const app = new MyReact({
//   el: "#app",
//   render() {
//     const hello = () => console.log("Hello, Dolly")
//     const setCurrentDateButton = document.createElement("button")
//     setCurrentDateButton.innerHTML = "Set Current Date"
//     setCurrentDateButton.addEventListener("click", () => hello())

//     return html`
//       <fieldset>
//         <legend>Test input</legend>
//         <input type="text" id="myInput" placeholder="Some text" />
//       </fieldset>

//       <fieldset>
//         <legend>Set Current Date</legend>
//         <button onClick="${() => hello()}">Set Current Date</button>
//       </fieldset>

//       <fieldset disabled="disabled">
//         <legend>Output</legend>
//         <div id="output"></div>
//       </fieldset>
//     `
//   },
// })

/////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

// document.addEventListener("DOMContentLoaded", () => {
//   const input = document.querySelector("#myInput"),
//     output = document.querySelector("#output"),
//     button = document.querySelector("#setCurrentDate")

//   const data = {}
//   data._previousAttributes = {}

//   const attributeName = "text"
//   Object.defineProperty(data, attributeName, {
//     set: (currentValue) => {
//       const previousValue = data._previousAttributes[attributeName] || null
//       if (previousValue === currentValue) return
//       console.log(`Value was changed from "${previousValue}" to: "${currentValue}"`)

//       data._previousAttributes[attributeName] = currentValue
//       input.value = currentValue
//       output.innerText = currentValue
//     },
//   })

//   const needEvents = ["keyup", "change"]
//   needEvents.forEach((eventName) => {
//     input.addEventListener(eventName, (e) => {
//       data.text = e.target.value
//     })
//   })

//   button.addEventListener("click", () => {
//     data.text = new Date().toLocaleDateString("ru-UA", { hour: "numeric", minute: "numeric", second: "numeric" })
//   })
// })
