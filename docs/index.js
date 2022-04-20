"use strict"

const { ast: html } = HierParser

class App extends Hier.BaseComponent {
  render() {
    return html` <h2>Hello👋</h2> `
  }
}

document.addEventListener("DOMContentLoaded", () => {
  Hier.render(App, document.getElementById("app"))
})
