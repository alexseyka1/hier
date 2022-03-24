"use strict"

const { createElement } = Hier
const app = createElement("form", null, [
  createElement("fieldset", null, [
    createElement("legend", null, "Register Form"),
    createElement("main", null, [
      createElement("div", null, [
        createElement("label", null, [
          "First Name: ",
          createElement("input", { type: "text", placeholder: "First Name" }),
        ]),
      ]),
      createElement("div", null, [
        createElement("label", null, [
          "Last Name: ",
          createElement("input", { type: "text", placeholder: "Last Name" }),
        ]),
      ]),
      createElement("div", null, [
        createElement("label", null, ["Age: ", createElement("input", { type: "number", placeholder: "Age", min: 0 })]),
      ]),
    ]),
    createElement("footer", null, [createElement("button", { type: "button" }, "Register")]),
  ]),
])
document.querySelector("#app").appendChild(app)

/**
 *
 */
console.time("HTML parsing")
const { html } = HierParser
const buttonText = `Lets register!`
const app2 = html`<form action="/some/cool/url" method="post">
  <fieldset>
    <legend>Register Form</legend>
    <main>
      <div>
        <label>
          First Name:
          <input type="text" placeholder="First Name" />
        </label>
      </div>

      <div>
        <label>
          Last Name:
          <input type="text" placeholder="Last Name" />
        </label>
      </div>

      <div>
        <label>
          Age:
          <input type="number" placeholder="Age" min="0" />
        </label>
      </div>
    </main>

    <footer>
      <button type="button">${buttonText}</button>
    </footer>
  </fieldset>
</form>`
console.timeEnd("HTML parsing")

console.log(app2)
app2.map((element) => document.querySelector("#app").appendChild(element))
