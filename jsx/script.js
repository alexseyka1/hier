"use strict"

/**
 *
 */
console.time()
const { html, Component, BaseComponent } = Hier

class UserName extends BaseComponent {
  render() {
    return html`<span class="username">${this.props.name}</span>`
  }
}

class Hello extends BaseComponent {
  render() {
    return html`Hello, <${UserName} name=${this.props.name || "(noname)"} />`
  }
}

class App extends Component {
  render() {
    const buttonText = `Lets register!`
    const setFirstName = (e) => this.setState({ firstName: e.target.value })
    const setLastName = (e) => this.setState({ lastName: e.target.value })
    const clickButton = () => alert("Okay, lets go!")

    return html`Before Application Test

      <div>Yo 1: <${Hello} /></div>
      Yo 2: <${Hello} />

      <form action="/some/cool/url" method="post">
        <fieldset>
          <legend>Register Form</legend>
          <main>
            <div>
              <input type="text" placeholder="First Name" onInput=${setFirstName} />
              <input type="text" placeholder="Last Name" onInput=${setLastName} />
            </div>

            <div>
              <label>
                Age:
                <input type="number" placeholder="Age" min="0" />
              </label>
            </div>
          </main>

          <footer>
            <button type="button" onClick=${clickButton}>${buttonText}</button>
          </footer>
        </fieldset>
      </form>
      After Application Text`
  }
}

Hier.render(App, document.getElementById("app"))
console.timeEnd()
