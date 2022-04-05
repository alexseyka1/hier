class App extends Hier.Component {
  constructor(props) {
    super(props)
    this._state = {
      posts: [],
      selectedPost: null,
    }

    this.onPostSelected = this.onPostSelected.bind(this)
  }

  afterMount() {
    fetch("https://jsonplaceholder.typicode.com/posts")
      .then((response) => response.json())
      .then((posts) => this.setState({ posts }))
  }

  onPostSelected(post) {
    this.setState({ selectedPost: post })
  }

  render() {
    const { posts, selectedPost } = this.state
    return html`<div class="main w-100">
      <${Sidebar} posts=${posts} selectedPost=${selectedPost} onPostSelected=${this.onPostSelected} class="shadow-lg" />
      <div class="b-example-divider"></div>
      ${selectedPost ? html`<${PostView} post=${selectedPost} class="w-100" />` : null}
    </div>`
  }
}
