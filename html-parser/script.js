"use strict"

console.time()

const username = "alexseyka1"

class CoolComponent extends ReactionComponent {
  constructor(props) {
    super(props)
  }
  render() {
    return jsx`<div>Hello, from coolest component is the world (and i have some children ;D)!</div>`
  }
}

const SayHello = (props) => {
  return jsx`<span>Hello, ${props.name || "Dolly"}!</span>`
}
const componentName = "SayHello"
const testObj = { hello: "Dolly", num: 123.45 }

const TestApp = function () {
  const setCurrentDate = () => {
    document.querySelector("#myInput").value = Date.now()
  }

  const { text } = this.state

  return ast`
    Test application
    <CoolComponent say="olololo" style="border: 1px solid red">
        <strong>And bold text</strong>
        <fieldset class="say-hello">
            <SayHello name="${username}" obj=${testObj}/>
        </fieldset>
    </CoolComponent>
    <hr>

    <fieldset>
      <legend>Test input</legend>
      <input type="text" id="myInput" placeholder="Some text" 
        onChange=${(e) => this.setState({ text: e.target.value })} 
      />
    </fieldset>

    <fieldset>
      <legend>Set Current Date</legend>
      <button onClick="${() => setCurrentDate()}">Set Current Date</button>
    </fieldset>

    <fieldset disabled="disabled">
      <legend>Output</legend>
      <strong>${text || ""}</strong>
    </fieldset>
  `
}

Reaction.render(TestApp, document.querySelector("#app"))

console.timeEnd()
