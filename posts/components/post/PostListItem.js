class PostListItem extends Hier.BaseComponent {
  render() {
    const { post, active = false, onSelect } = this.props
    if (!post) return null

    let classList = "list-group-item list-group-item-action py-3 lh-tight border-0 border-bottom"
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
      <div class="col-10 mb-1 small opacity-75">${post.body.substr(0, 80)}</div>
      <div class="d-flex align-items-center">
        <${Avatar} size="16" username=${post.userId} />
        <small class="ms-2 text-secondary">Some User</small>
      </div>
    </a>`
  }
}
