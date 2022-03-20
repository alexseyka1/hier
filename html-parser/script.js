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
  //   console.log(this)
  return jsx`<span>Hello, ${props.name || "Dolly"}!</span>`
}
const componentName = "SayHello"
const testObj = { hello: "Dolly", num: 123.45 }

const TestApp = () => {
  const hello = () => {
    document.querySelector("#myInput").value = Intl.DateTimeFormat("ru").format(new Date())
    alert("Hello, amigo!")
  }

  return ast`
    Test application
    <hr/>
    <CoolComponent say="olololo" style="border: 1px solid red">
        <ul>
            <li>First</li>
            <li>Second</li>
            <li>And third</li>
        </ul>
        <strong>And bold text</strong>
        <fieldset class="say-hello">
            <SayHello name="${username}" obj=${testObj}/>
        </fieldset>
    </CoolComponent>
    <hr>

    <fieldset>
      <legend>Test input</legend>
      <input type="text" id="myInput" placeholder="Some text" />
    </fieldset>

    <fieldset>
      <legend>Set Current Date</legend>
      <button onClick="${() => hello()}">Set Current Date</button>
    </fieldset>

    <fieldset disabled="disabled">
      <legend>Output</legend>
      <div id="output"></div>
    </fieldset>
  `
}

Reaction.render(TestApp, document.querySelector("#app"))

console.timeEnd()
