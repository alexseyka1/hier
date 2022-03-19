"use strict"
document.addEventListener("DOMContentLoaded", () => {
  const input = document.querySelector("#myInput"),
    output = document.querySelector("#output"),
    setCurrentDateButton = document.querySelector("#setCurrentDate"),
    sayHelloButton = document.querySelector("#sayHello")

  const data = {}
  data._previousAttributes = {}

  const attributeName = "text"
  Object.defineProperty(data, attributeName, {
    set: (currentValue) => {
      const previousValue = data._previousAttributes[attributeName] || null
      if (previousValue === currentValue) return
      console.log(`Value was changed from "${previousValue}" to: "${currentValue}"`)

      data._previousAttributes[attributeName] = currentValue
      input.value = currentValue
      output.innerText = currentValue
    },
  })

  const needEvents = ["keyup", "change"]
  needEvents.forEach((eventName) => {
    input.addEventListener(eventName, (e) => {
      data.text = e.target.value
    })
  })

  const setCurrentDate = () => {
    data.text = new Date().toLocaleDateString("ru-UA", { hour: "numeric", minute: "numeric", second: "numeric" })
  }
  setCurrentDateButton.addEventListener("click", () => setCurrentDate())
  sayHelloButton.addEventListener("click", () => {
    data.text = "Hello, Dolly"
  })

  // setInterval(() => setCurrentDate(), 1000)
})
