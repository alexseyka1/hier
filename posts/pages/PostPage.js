class PostPage extends Hier.Component {
  constructor(props) {
    super(props)
    this._state = { post: null }
  }

  afterMount() {
    const { id } = this.props
    if (!id) return
    this.fetchPost(id)
  }

  fetchPost(id) {
    Services.posts.getPost(id).then((post) => this.setState({ post }))
  }

  afterUpdate() {
    const { id } = this.props
    if (!id) this.setState({ post: null })
    this.fetchPost(id)
  }

  render() {
    const { post } = this.state
    if (!post) return html`<${Loader} />`

    return html`<div class="container">
      <div class="bg-white shadow">
        <div class="bg-light p-3 shadow-sm border-bottom">
          <h2 class="display-6">${post.title}</h2>
          <div class="mt-4 d-flex position-relative align-items-center">
            <a href="#user/${post.user.id}" class="d-inline-flex btn btn-outline-primary border-0 text-reset">
              <${Avatar} username=${post.user.id} size="24" />
              <div class="ms-2">${post.user.name}</div>
              <span class="ms-2 text-muted text-reset">
                <span class="small">${post.user.username}</span>
              </span>
            </a>
          </div>
        </div>

        <div class="p-3">${post.body.repeat(10)}</div>

        <${CommentsList} postId=${post.id} />
      </div>
    </div>`
  }
}
