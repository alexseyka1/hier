class UsersPage extends Hier.Component {
  USERS_PER_PAGE = 20

  constructor(props) {
    super(props)
    this._state = {
      users: [],
      page: 1,
    }
  }

  onSelectUser(user) {
    window.location.hash = `user/${user.id}`
  }

  changePage(event, action) {
    event.preventDefault()

    const page = action === "prev" ? this.state.page - 1 : this.state.page + 1
    const uriParams = Helper.queryParams.toString({ ...Helper.queryParams.fromString(), page })
    window.history.replaceState(null, null, window.location.origin + window.location.pathname + `?${uriParams}#users`)

    this.setState({ page })
    document.querySelector(".scrollarea").scrollTo({ top: 0, behavior: "smooth" })
  }

  afterMount() {
    if (!this.state.users.length) {
      Services.users.getUsers().then((users) => this.setState({ users }))
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

  getUsers() {
    const { users, page } = this.state
    if (!users.length) return []
    return users.slice((page - 1) * this.USERS_PER_PAGE, this.USERS_PER_PAGE * page)
  }

  hasPrevPage() {
    return +this.state.page > 1
  }

  hasNextPage() {
    if (!this.state.users) return false
    return this.state.page * this.USERS_PER_PAGE < this.state.users.length
  }

  getNavigationBlock() {
    const { users } = this.state
    if (!users || !users.length || users.length < this.USERS_PER_PAGE) return

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
    const users = this.getUsers()
    const navigationBlock = this.getNavigationBlock()

    if (!users.length) {
      return html`<${Loader} />`
    }

    return html`<div class="container">
      <div class="list-group list-group-flush border-bottom">
        ${users.map((user) => html`<${UserListItem} user=${user} onSelect=${(user) => this.onSelectUser(user)} />`)}
      </div>

      ${navigationBlock}
    </div>`
  }
}
