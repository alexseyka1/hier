<img width="1280" alt="hier-description" src="https://user-images.githubusercontent.com/2858470/165038325-59f8e6f5-9c98-4c92-99ec-7be3e0ab18b3.png">

⚡️ Invented as an alternative to existing libraries, allowing you to add new functionality to existing non-JavaScript projects without using build systems. The syntax of template literals is very simple and already familiar. So why not use all its power, right?

[📕 Click here to read full documentation](https://alexseyka1.github.io/hier/docs)

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

[✅ More examples with working applications you can find in `examples` folder](https://github.com/alexseyka1/hier/tree/master/examples)
