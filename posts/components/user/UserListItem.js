class UserListItem extends Hier.BaseComponent {
  render() {
    const { user, active = false, onSelect } = this.props
    if (!user) return null

    let classList = "list-group-item list-group-item-action py-3 lh-tight border-0 border-bottom"
    if (active) classList += " active"

    const onSelected = (e, user) => {
      e.preventDefault()
      if (typeof onSelect === "function") onSelect(user)
    }

    const linkHref = `?#user/${user.id}`
    return html`<a onClick=${(e) => onSelected(e, user)} href=${linkHref} key=${user.id} class=${classList}>
      <div class="d-flex">
        <${Avatar} size="40" username=${user.id} />
        <div class="ms-3 w-100">
          <div class="d-flex w-100 align-items-center justify-content-between">
            <strong class="mb-1">${user.name}</strong>
            <small>#${user.id}</small>
          </div>
          <div class="col-10 mb-1 small opacity-75">${user.email}</div>
        </div>
      </div>
    </a>`
  }
}
