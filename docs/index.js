"use strict"

const { ast: html } = HierParser

class App extends Hier.BaseComponent {
  render() {
    return html` <h1>Hello👋</h1> `
  }
}

document.addEventListener("DOMContentLoaded", () => {
  Hier.render(App, document.getElementById("app"))
})
