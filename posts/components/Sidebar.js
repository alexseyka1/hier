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
