importScripts("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.5.1/highlight.min.js")
importScripts("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.5.1/languages/javascript.min.js")
onmessage = (event) => {
  const { text, index } = event.data
  const result = self.hljs.highlightAuto(text)
  postMessage({ result: result.value, index })
}
