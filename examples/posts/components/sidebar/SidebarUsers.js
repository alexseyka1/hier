class SidebarUsers extends Hier.Component {
  constructor(props) {
    super(props)
    this._state = {
      users: [],
      selectedUserId: this.getActiveUserId(),
    }
    this.activeUser = Hier.createRef()
  }

  getActiveUserId() {
    const hash = window.location.hash
    const match = hash.match(/user\/(?<id>\d+)/)
    if (match && match.groups) return match.groups.id
    return null
  }

  afterMount() {
    setTimeout(() => {
      this.activeUser.elem && this.activeUser.elem.scrollIntoView({ block: "center" })
    }, 100)
  }

  onSelectUser(user) {
    window.location.hash = `user/${user.id}`
    this.setState({ selectedUserId: user.id })
  }

  render() {
    const { users, selectedUserId } = this.state

    if (!users.length) {
      Services.users.getUsers().then((users) => this.setState({ users }))
      return html`<${Loader} />`
    }

    return html`<div class="list-group list-group-flush border-bottom">
      ${users.map(
        (user) =>
          html`<${UserListItem}
            user=${user}
            active=${selectedUserId == user.id}
            ref=${selectedUserId == user.id ? this.activeUser : null}
            onSelect=${(user) => this.onSelectUser(user)}
          />`
      )}
    </div>`
  }
}
