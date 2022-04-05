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
