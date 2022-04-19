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

    const linkHref = `?#post/${post.id}`
    return html`<a onClick=${(e) => onSelected(e, post)} href=${linkHref} key=${post.id} class=${classList}>
      <div class="d-flex w-100 align-items-top justify-content-between">
        <strong class="mb-1" title=${post.title}>${post.title}</strong>
        <small class="opacity-25">#${post.id}</small>
      </div>
      <div class="col-10 mb-1 small opacity-75">${post.body.repeat(10).substr(0, 200)}</div>
      <${UserName} id=${post.userId} />
    </a>`
  }
}
