"use strict"

console.time("All app")

const username = "alexseyka1"

class CoolComponent extends ReactionComponent {
  constructor(props) {
    super(props)
  }
  render() {
    return jsx`<div>Hello, from coolest component in the world (and i have some children ;D)!</div>`
  }
}

const SayHello = (props) => {
  return jsx`<span>Hello, ${props.name || "Dolly"}!</span>`
}
const componentName = "SayHello"
const testObj = { hello: "Dolly", num: 123.45 }

const TestApp = () => {
  return ast`
    Test application
    <CoolComponent say="olololo" style="border: 1px solid red">
        <strong>Some bold text</strong>
        <fieldset class="say-hello">
            <SayHello name="${username}" obj=${testObj}/>
        </fieldset>
    </CoolComponent>
  `
}

class App extends ReactionComponent {
  render() {
    const setCurrentDate = () => {
      document.querySelector("#myInput").value = Date.now()
    }

    const { text } = this.state

    return ast`
      <style>
        .bg-gray {
          background-color: #f4f4f4;
        }
      </style>

      <TestApp />

      <hr>

      <fieldset>
        <legend>Test input</legend>
        <input type="text" id="myInput" placeholder="Some text"
          value=${text || ""}
          onChange=${(e) => this.setState({ text: e.target.value })} 
        />
      </fieldset>

      ${!text ? "EMPTY" : null}

      <fieldset>
        <legend>Set Current Date</legend>
        <button onClick="${() => setCurrentDate()}">Set Current Date</button>
      </fieldset>

      <fieldset disabled="disabled" class=${!text ? "" : "bg-yellow"}>
        <legend>Output</legend>
        <strong id="text-may-be-here">${text || null}</strong>
      </fieldset>
    `
  }
}

Reaction.render(App, document.querySelector("#app"))

console.timeEnd("All app")
