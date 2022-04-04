"use strict"

// var __DEV__ = true
// var __DEBUG__ = true

const { ast: html } = new HierParser()

class Loader extends Hier.BaseComponent {
  render() {
    return html`<div class="fa-3x w-100 d-flex justify-content-center p-4 text-muted opacity-25">
      <i class="fa-solid fa-circle-notch fa-spin"></i>
    </div>`
  }
}

class PostListItem extends Hier.BaseComponent {
  render() {
    const { post, active = false, onSelect } = this.props
    if (!post) return null

    let classList = "list-group-item list-group-item-action py-3 lh-tight"
    if (active) classList += " active"

    const onSelected = (e, post) => {
      e.preventDefault()
      if (typeof onSelect === "function") onSelect(post)
    }

    return html`<a onClick=${(e) => onSelected(e, post)} href="#" key=${post.id} class=${classList}>
      <div class="d-flex w-100 align-items-center justify-content-between">
        <strong class="mb-1 sidebar-title__strong" title=${post.title}>${post.title}</strong>
        <small class="text-muted">Mon</small>
      </div>
      <div class="col-10 mb-1 small">Some placeholder content in a paragraph below the heading and date.</div>
    </a>`
  }
}

class Sidebar extends Hier.BaseComponent {
  render() {
    const { posts, selectedPost, onPostSelected } = this.props
    let postsBlock = html`<${Loader} />`
    const selectedPostId = selectedPost && selectedPost.id ? selectedPost.id : null

    if (posts && posts.length) {
      postsBlock = html`<div class="list-group list-group-flush border-bottom scrollarea">
        ${posts.map(
          (post) =>
            html`<${PostListItem}
              post=${post}
              active=${selectedPostId === post.id}
              onSelect=${(post) => onPostSelected(post)}
            />`
        )}
      </div>`
    }

    return html`<div class="main d-flex flex-column align-items-stretch flex-shrink-0 bg-white" style="width: 380px;">
      <div class="d-flex align-items-center flex-shrink-0 p-3 link-dark text-decoration-none border-bottom">
        <span class="fs-5 fw-semibold">All posts</span>
      </div>
      ${postsBlock}
    </div>`
  }
}

class PostView extends Hier.Component {
  render() {
    const { post } = this.props
    if (typeof post !== "object") return null

    return html`<div class="main w-100 shadow d-flex flex-column align-items-stretch flex-shrink-0 bg-white scrollarea">
      <div class="d-flex align-items-center flex-shrink-0 p-3 link-dark text-decoration-none border-bottom">
        <span class="fs-5 fw-semibold">${post.title}</span>
      </div>
      <div class="p-3">${post.body}</div>
    </div>`
  }
}

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

document.addEventListener("DOMContentLoaded", () => {
  Hier.render(App, document.getElementById("app"))
})
