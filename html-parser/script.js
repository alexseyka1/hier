"use strict"

console.time()

const username = "alexseyka1"
const SayHello = (props) => {
  console.log(this)
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
    
    <fieldset>
        <SayHello name="${username}" obj=${testObj}/>
    </fieldset>

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
