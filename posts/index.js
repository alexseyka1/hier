"use strict"

// var __DEV__ = true
// var __DEBUG__ = true
// var __PROFILING__ = true

const { ast: html } = new HierParser()

document.addEventListener("DOMContentLoaded", () => {
  Hier.render(App, document.getElementById("app"))
})
