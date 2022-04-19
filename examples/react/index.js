"use strict"

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

    return r`<button onClick=${() => this.setState({ liked: true })}>Like ${number}</button>`
  }
}

class App extends React.Component {
  render() {
    return r`
      <div>
        <h1>Header</h1>
        <fieldset style=${{ backgroundColor: "#f4f4f4" }}>
          <legend>Buttons list</legend>

          ${new Array(100).fill(0).map(
            (item, idx) => r`<div key="item-${idx}">
              <${LikeButton} number=${idx} />
            </div>`
          )}
        </fieldset>
      </div>
    `
  }
}

ReactDOM.render(React.createElement(App), document.querySelector("#app"))
