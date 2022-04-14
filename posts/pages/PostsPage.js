class PostsPage extends Hier.Component {
  POSTS_PER_PAGE = 20

  constructor(props) {
    super(props)
    this._state = {
      posts: [],
      page: 1,
    }
  }

  onSelectPost(post) {
    window.location.hash = `post/${post.id}`
  }

  changePage(event, action) {
    event.preventDefault()

    const page = action === "prev" ? this.state.page - 1 : this.state.page + 1
    const uriParams = Helper.queryParams.toString({ ...Helper.queryParams.fromString(), page })
    window.history.replaceState(null, null, window.location.origin + window.location.pathname + `?${uriParams}#posts`)

    this.setState({ page })
    document.querySelector(".scrollarea").scrollTo({ top: 0, behavior: "smooth" })
  }

  afterMount() {
    const { userId } = Helper.queryParams.fromString()
    if (!this.state.posts.length) {
      if (userId) Services.posts.getPostsByUser(userId).then((posts) => this.setState({ posts }))
      else Services.posts.getPosts().then((posts) => this.setState({ posts }))
    }

    if (location.search) {
      const search = location.search.substring(1)
      const getParams = JSON.parse(
        '{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}'
      )
      if (getParams.page) {
        this.setState({ page: +getParams.page })
      }
    }
  }

  getUserBlock() {
    const { userId } = Helper.queryParams.fromString()
    if (!userId) return

    return html`<h5 class="m-0 px-3 py-3 bg-light border-bottom">
      <${UserName} id=${userId} avatarSize="48" />
    </h5>`
  }

  getPosts() {
    const { posts, page } = this.state
    if (!posts.length) return []
    return posts.slice((page - 1) * this.POSTS_PER_PAGE, this.POSTS_PER_PAGE * page)
  }

  hasPrevPage() {
    return +this.state.page > 1
  }

  hasNextPage() {
    if (!this.state.posts) return false
    return this.state.page * this.POSTS_PER_PAGE < this.state.posts.length
  }

  getNavigationBlock() {
    const { posts } = this.state
    if (!posts || !posts.length || posts.length < this.POSTS_PER_PAGE) return

    return html`<nav class="mt-4">
      <ul class="pagination justify-content-center">
        <li class="page-item ${!this.hasPrevPage() && "disabled"}">
          <a class="page-link" href="#" onClick=${(e) => this.changePage(e, "prev")}>
            <i class="fa-solid fa-angle-left me-2"></i>
            <span>Prev</span>
          </a>
        </li>
        <li class="page-item ${!this.hasNextPage() && "disabled"}">
          <a class="page-link" href="#" onClick=${(e) => this.changePage(e, "next")}>
            <span>Next</span>
            <i class="fa-solid fa-angle-right ms-2"></i>
          </a>
        </li>
      </ul>
    </nav>`
  }

  render() {
    const userBlock = this.getUserBlock()
    const posts = this.getPosts()
    const navigationBlock = this.getNavigationBlock()

    if (!posts.length) {
      return html`<${Loader} />`
    }

    return html`<div class="container">
      ${userBlock}

      <div class="list-group list-group-flush border-bottom">
        ${posts.map((post) => html`<${PostListItem} post=${post} onSelect=${(post) => this.onSelectPost(post)} />`)}
      </div>

      ${navigationBlock}
    </div>`
  }
}
