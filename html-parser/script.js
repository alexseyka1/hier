"use strict"

const username = "Dolly"
const textFunction = () => alert("It works!")

console.time()
const rendered = jsx`<div>
    <div>
        Hello, ${username}
    </div>
    <div>My number is: {num}</div>
    <div>
    <button onclick=${() => textFunction()}>Increment +</button>
    <button onclick=${() => textFunction()}>Decrement -</button>
    </div>
</div>`

document.querySelector("#app").appendChild(rendered)
console.timeEnd()
