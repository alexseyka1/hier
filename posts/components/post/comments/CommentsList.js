class CommentsList extends Hier.Component {
  afterMount() {
    const { postId } = this.props
    if (!postId) return
    this.fetchComments(postId)
  }

  fetchComments(postId) {
    Services.comments.getComments(postId).then((comments) => this.setState({ comments }))
  }

  afterUpdate(props, prevProps) {
    if (props.postId === prevProps.postId) return
    this.setState({ comments: undefined })
    const { postId } = props
    this.fetchComments(postId)
  }

  render() {
    const { comments } = this.state
    if (typeof comments === "undefined") return html`<${Loader} />`
    if (!comments.length) {
      return html`<div class="p-3 mt-3 bg-light text muted">No comments yet.</div>`
    }

    return html`<div class="p-3 mt-3 bg-light shadow-sm border-bottom">
        <h5 class="m-0 text-secondary">
          Comments
          <span class="badge bg-secondary ms-2">${comments.length}</span>
        </h5>
      </div>
      <div class="comments-list">
        ${comments.map(
          (comment) => html`<div class="card-body border-bottom" key=${comment.id}>
            <div>
              <p>${comment.body}</p>
              <footer class="blockquote-footer">
                ${comment.name || "(anonymous)"}
                <a href="mailto:${comment.email}">
                  <small class="ms-1">${comment.email}</small>
                </a>
              </footer>
            </div>
          </div>`
        )}
      </div>`
  }
}
