class Navbar extends Hier.Component {
  _state = { time: Date.now() }

  constructor(props) {
    super(props)
    this.onChangeUrl = this.onChangeUrl.bind(this)
  }

  onChangeUrl(event) {
    const { onChange } = this.props
    this.setState({ time: Date.now() })
    if (typeof onChange === "function") onChange()
  }

  afterMount() {
    window.addEventListener("popstate", this.onChangeUrl)
  }

  beforeUnmount() {
    window.removeEventListener("popstate", this.onChangeUrl)
  }

  render() {
    const hash = window.location.hash

    const homeActive = hash === ""
    const postsActive = /^#post(s\/.*)?/.test(hash)
    const usersActive = /^#user(s\/.*)?/.test(hash)

    return html`<nav
      class="w-100 d-flex justify-content-center p-3 ${!homeActive && "glass-bg shadow-sm border-bottom"}"
    >
      <ul class="nav nav-pills">
        <li class="nav-item">
          <a href="?#" class="nav-link link-dark d-inline-flex align-items-center">
            <small class="fa fa-house me-1 opacity-75"></small>
            Home
          </a>
        </li>
        <li class="nav-item">
          <a href="?#posts" class="nav-link link-dark d-inline-flex align-items-center ${postsActive && "active"}">
            <small class="fa fa-bars-staggered me-1 opacity-75"></small>
            Posts
          </a>
        </li>
        <li class="nav-item">
          <a href="?#users" class="nav-link link-dark d-inline-flex align-items-center ${usersActive && "active"}">
            <small class="fa-solid fa-user me-1 opacity-75"></small>
            Users
          </a>
        </li>
      </ul>
    </nav>`
  }
}
