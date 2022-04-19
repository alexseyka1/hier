class UserName extends Hier.Component {
  _state = { user: null }

  afterMount() {
    const { id } = this.props
    if (!this.state.user) {
      Services.users.getUser(id).then((user) => this.setState({ user }))
    }
  }

  render() {
    const { avatarSize = 16 } = this.props
    const { user } = this.state

    if (!user) {
      return html`<p class="placeholder-glow m-0 opacity-25">
        <span class="placeholder col-4"></span>
      </p>`
    }

    return html`<div class="d-flex align-items-center">
      <${Avatar} size=${avatarSize} username=${user.id} />
      <small class="ms-2">${user.name}</small>
    </div>`
  }
}
