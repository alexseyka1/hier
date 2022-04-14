class UserPage extends Hier.Component {
  MAX_POSTS = 3
  _state = {
    user: null,
    posts: [],
    albums: [],
  }

  afterMount() {
    const { id } = this.props
    if (!id) return
    this.fetchUser(id)
  }

  fetchUser(id) {
    Services.users.getUser(id).then((user) => this.setState({ user }))
    Services.posts.getPostsByUser(id).then((posts) => this.setState({ posts }))
    Services.albums.getAlbumsByUser(id).then((albums) => this.setState({ albums }))
  }

  afterUpdate() {
    const { id } = this.props
    if (!id) this.setState({ user: null })
    this.fetchUser(id)
  }

  getPostsBlock() {
    const { posts = [] } = this.state

    let content
    if (!posts.length) {
      content = html`<${Loader} />`
    } else {
      content = html`<div class="list-group list-group-flush">
        ${posts
          .slice(0, this.MAX_POSTS)
          .map(
            (post) =>
              html`<${PostListItem} post=${post} onSelect=${(post) => (window.location.hash = `post/${post.id}`)} />`
          )}
      </div>`
    }

    return html` <div
        class="p-3 bg-light border-bottom border-top my-2 d-flex justify-content-between align-items-center"
      >
        <div class="m-0 text-secondary d-flex align-items-center">
          <span class="fs-5">Posts</span>
          <span class="badge rounded-pill mt-1 bg-secondary ms-2">${posts.length}</span>
        </div>
        ${posts.length > this.MAX_POSTS &&
        html`<a class="btn btn-sm btn-outline-primary" href="?userId=${this.props.id}#posts">
          <i class="fa-solid fa-bars-staggered me-1"></i>
          View all posts
        </a>`}
      </div>

      ${content}`
  }

  getAlbumsBlock() {
    const { albums = [] } = this.state

    let content
    if (!albums.length) {
      content = html`<${Loader} />`
    } else {
      content = html`<div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-3 p-3">
        ${albums.map((album) => html`<${AlbumListItem} class="col" album=${album} />`)}
      </div>`
    }

    return html` <div
        class="p-3 bg-light border-bottom border-top my-2 d-flex justify-content-between align-items-center"
      >
        <div class="m-0 text-secondary d-flex align-items-center">
          <span class="fs-5">Photo Albums</span>
          <span class="badge rounded-pill mt-1 bg-secondary ms-2">${albums.length}</span>
        </div>
      </div>

      ${content}`
  }

  render() {
    const { user } = this.state
    if (!user) return html`<${Loader} />`

    let company
    if (user.company) {
      company = html`<div class="p-3">
        <h4>${user.company.name}</h4>
        <div class="text-secondary">${user.company.catchPhrase}</div>
        <div class="text-secondary">${user.company.bs}</div>
      </div>`
    }

    const postsBlock = this.getPostsBlock()
    const albumbsBlock = this.getAlbumsBlock()

    return html`<div class="container">
      <div class="bg-white shadow">
        <div class="d-flex w-100 flex-column flex-md-row">
          <div>
            <img class="w-100" style="min-width: 256px" src=${user.avatarUrl} alt=${user.name} title=${user.name} />
          </div>
          <div class="w-100">
            <div class="p-3">
              <h1 class="m-0">
                ${user.name}
                <small class="fs-5 text-secondary ms-2">&mdash; ${user.username}</small>
              </h1>
              <div class="text-muted">${user.email}</div>
            </div>

            ${company}
          </div>
        </div>

        ${postsBlock} ${albumbsBlock}
      </div>
    </div>`
  }
}
