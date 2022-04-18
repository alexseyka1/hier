// var __DEV__ = true

const { ast: html } = new HierParser()
document.addEventListener("DOMContentLoaded", () => {
  Hier.render(App, document.getElementById("app"))
})
