# Hier
📕 This is a JavaScript library that parses and renders components written in template literals really fast.

😎 You don't need any build systems or framework anymore. You can easily add some logic to your existing project written not on JavaScript (on PHP, for example). 

⚡️ Get started quickly.

## Simple example
<pre>
  const { ast: html } = HierParser
  class App extends Hier.BaseComponent {
    render() {
      return html` &lt;h1&gt;Hello&lt;/h1&gt; `
    }
  }
  Hier.render(App, document.getElementById("app"))
</pre>

## Component with state
<pre>
const { ast: html } = HierParser
class App extends Hier.Component {
  _state = { liked: false }
  render() {
    const { liked } = this.state
    if (liked) return `You liked this!`
    
    return html`
      &lt;div&gt; Lets try to like this: &lt;/div&gt;
      &lt;button onClick=${() => this.setState({ liked: true })}&gt; ❤️Like &lt;/button&gt;
    `
  }
}

document.addEventListener("DOMContentLoaded", () => {
  Hier.render(App, document.getElementById("app"))
})
</pre>

## Wrapper component
<pre>
const { ast: html } = HierParser
class Card extends Hier.BaseComponent {
  render() {
    const { children, header, footer } = this.props

    return html`&lt;div class="card"&gt;
      ${header && html`&lt;div class="card-header"&gt; ${header} &lt;/div&gt;`}
      &lt;div class="card-body"&gt; ${children} &lt;/div&gt;
      ${footer && html`&lt;div class="card-footer"&gt; ${footer} &lt;/div&gt;`}
    </div>`
  }
}

class App extends Hier.Component {
  render() {
    const header = html`&lt;div&gt; Some cool &lt;strong&gt;header&lt;/strong&gt; &lt;/div&gt;`
    const footer = html`&lt;a href="#" class="btn btn-primary"&gt; Go somewhere &lt;/a&gt;`

    return html`
      &lt;${Card} header=${header} footer=${footer}&gt;
        &lt;h5 class="card-title"&gt; Card title here &lt;/h5&gt;
        &lt;p class="card-text"&gt; And some awesome text here. &lt;/p&gt;
      &lt;/Card&gt;
    `
  }
}
</pre>

## Working with react components
<pre>
const { react: r } = HierReact
class LikeButton extends React.Component {
  constructor(props) {
    super(props)
    this.state = { liked: false }
  }

  render() {
    const { number } = this.props
    if (this.state.liked) {
      return `You liked this ${number}`
    }
    return r`&lt;button onClick=${() => this.setState({ liked: true })}&gt;Like ${number}&lt;/button&gt;`
  }
}

class App extends React.Component {
  render() {
    return r`
      &lt;div>
        &lt;h1&gt; Header &lt;/h1&gt;
        &lt;fieldset style=${{ backgroundColor: "#f4f4f4" }}&gt;
          &lt;legend&gt; Buttons list &lt;/legend&gt;

          ${new Array(10).fill(0).map(
            (item, idx) => r`&lt;div key="item-${idx}"&gt;
              &lt;${LikeButton} number=${idx} /&gt;
            &lt;/div&gt;`
          )}
        &lt;/fieldset&gt;
      &lt;/div&gt;
    `
  }
}
</pre>

✅ More examples with working applications you can find in `examples` folder
