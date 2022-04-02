"use strict"
var __DEV__ = false
var __DEBUG__ = false

const { ast: html } = HierParser
const { Component, BaseComponent, Util } = Hier

class OrangeBg extends BaseComponent {
  render() {
    console.log(this.props.children)
    return html`<div class="I am wrapper">${this.props.children}</div>`
  }
}

class FullName extends BaseComponent {
  constructor(props) {
    super(props)
  }
  render() {
    const fullName = `${this.props.firstName || ""} ${this.props.lastName || ""}`.trim()
    return html`<strong className="fullname">${fullName || "(username)"}</strong>`
  }
}

class Hello extends BaseComponent {
  render() {
    const name = this.props.firstName
    const surname = this.props.lastName
    return html`Welcome to my test, <${FullName} firstName=${name} lastName=${surname} />`
  }
}

class LargeHeader extends BaseComponent {
  afterMount() {
    super.afterMount()
    // fetch("https://jsonplaceholder.typicode.com/posts")
    //   .then((response) => response.json())
    //   .then((json) => console.log(json))
  }
  render() {
    return html`<h1 className="red">${this.props.children}</h1>`
  }
}

class SmallHeader extends BaseComponent {
  render() {
    return html`<h2 className="blue">${this.props.children}</h2>`
  }
}

class Dynamic extends Component {
  constructor(props) {
    super(props)
    // this._state = { firstName: "Hello", lastName: "Dolly" }
  }
  render() {
    const { firstName, lastName } = this.state
    const setFirstName = (e) => this.setState({ firstName: e.target.value })
    const setLastName = (e) => this.setState({ lastName: e.target.value })

    return html`
      <div>
        <input type="text" placeholder="First Name" value=${firstName || ""} onInput=${setFirstName} />
        <input type="text" placeholder="Last Name" value=${lastName || ""} onInput=${setLastName} />
      </div>

      <fieldset>
        <legend>Resume</legend>
        <${Hello} firstName=${firstName} lastName=${lastName} />
      </fieldset>

      ${firstName && firstName.trim().length
        ? html`<h1 className="red">First Name Filled</h1>`
        : html`<${SmallHeader}>First Name is empty ;D</SmallHeader>`}
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
  constructor(props) {
    super(props)
    this._state = { legendText: "Register Form" }
  }
  render() {
    const buttonText = `Lets register!`
    const clickButton = () => {
      console.warn("Okay, lets go!")
    }

    const { legendText } = this.state
    const changeLegend = () => this.setState({ legendText: Math.random().toString(36).slice(2) })

    /** Full test */
    // return html`Before Application Test
    //   <hr />
    //   <form action="/some/cool/url" method="post">
    //     <${Fieldset} legend=${legendText}>
    //       <${OrangeBg} testText="Hello from props">
    //         <main>
    //           <${Dynamic} />
    //         </main>
    //       </OrangeBg>

    //       <${Hello} firstName="Alexsey" lastName="Gaidai" />

    //       <footer>
    //         <button type="button" onClick=${clickButton}>${buttonText}</button>
    //       </footer>
    //     </Fieldset>
    //   </form>
    //   <hr />
    //   <div>
    //     <button type="button" onClick=${() => changeLegend()}>Change legend text</button>
    //   </div>
    //   After Application Text`

    return html`
    Hello
      <${Fieldset} legend=${legendText}>
        <header>
          <${SmallHeader}>
            I am
          </SmallHeader>
          <${LargeHeader}>header</LargeHeader>
        </header>
        <main>
          I am main content
          <${Dynamic} />
        </main>
        <footer>
          Here is the footer
          <button type="button" onClick=${() => changeLegend()}>Change legend text</button>
        </footer>
      </Fieldset>
    `
  }
}

Hier.render(App, document.getElementById("app"))
