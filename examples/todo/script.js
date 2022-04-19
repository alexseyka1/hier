// var __DEV__ = true

const { ast: html } = HierParser
document.addEventListener("DOMContentLoaded", () => {
  Hier.render(App, document.getElementById("app"))
})
