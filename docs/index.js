"use strict"

const { ast: html } = HierParser

window.addEventListener("load", () => {
  const codeBlocks = document.querySelectorAll("pre > code")
  const worker = new Worker("code-worker.js")
  codeBlocks.forEach((elem, index) => {
    worker.postMessage({ text: elem.textContent, index })
  })

  worker.onmessage = (event) => {
    const { result, index } = event.data
    codeBlocks[index].innerHTML = result
  }
})

document.addEventListener("DOMContentLoaded", () => {})
