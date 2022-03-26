"use strict"

console.time()
const { html, Component, BaseComponent } = Hier

class OrangeBg extends BaseComponent {
  render() {
    return html`<div class="I am wrapper">${this.props.children}</div>`
  }
}

class FullName extends BaseComponent {
  render() {
    const fullName = `${this.props.firstName || ""} ${this.props.lastName || ""}`.trim()
    return html`<strong class="fullname">${fullName || "(username)"}</strong>`
  }
}

class Hello extends BaseComponent {
  render() {
    const name = this.props.firstName
    const surname = this.props.lastName
    return html`Welcome to my test, <${FullName} firstName=${name} lastName=${surname}>123</FullName>`
  }
}

class Dynamic extends Component {
  render() {
    const { firstName, lastName } = this.state
    const setFirstName = (e) => this.setState({ firstName: e.target.value })
    const setLastName = (e) => this.setState({ lastName: e.target.value })

    return html`
      <div>
        <input type="text" placeholder="First Name" onInput=${setFirstName} />
        <input type="text" placeholder="Last Name" onInput=${setLastName} />
      </div>

      <fieldset>
        <legend>Resume</legend>
        <${Hello} firstName=${firstName} lastName=${lastName} />
      </fieldset>
    `
  }
}

class Fieldset extends BaseComponent {
  render() {
    const legend = this.props.legend ? html`<legend>${this.props.legend}</legend>` : ""
    return html`<fieldset>${legend} ${this.props.children}</fieldset>`
  }
}

class App extends Component {
  render() {
    const buttonText = `Lets register!`
    const clickButton = () => alert("Okay, lets go!")

    return html`Before Application Test
      <hr />
      <form action="/some/cool/url" method="post">
        <${Fieldset} legend="Register Form">
          <${OrangeBg} testText="Hello from props">
            <main>
              <${Dynamic} />
            </main>
          </OrangeBg>

          <${Hello} firstName="Alexsey" lastName="Gaidai" />

          <footer>
            <button type="button" onClick=${clickButton}>${buttonText}</button>
          </footer>
        </Fieldset>
      </form>
      <hr />
      After Application Text`
  }
}

Hier.render(App, document.getElementById("app"))
console.timeEnd()
