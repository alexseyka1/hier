class HashRouter extends Hier.Component {
  constructor(props) {
    super(props)
    this._state = { time: Date.now() }
    this.onChangeUrl = this.onChangeUrl.bind(this)
  }

  onChangeUrl(event) {
    this.setState({ time: Date.now() })
  }

  afterMount() {
    window.addEventListener("popstate", this.onChangeUrl)
  }

  beforeUnmount() {
    window.removeEventListener("popstate", this.onChangeUrl)
  }

  render() {
    const hash = window.location.hash.replace(/^#/, "")
    const children = this.props.children
    if (!children || !children.length) return

    for (let child of children) {
      if (!child.props || !child.props[":route"]) continue
      let route = child.props[":route"].replace(/^\//, "")

      if (route === hash) return [child]
      else if (!route.trim().length) continue

      route = route.replace(/\:(\w+)/, "(?<$1>\\w*)")
      const regexp = new RegExp(route)
      if (regexp.test(hash)) {
        child.props = Object.assign({}, child.props, hash.match(regexp).groups)
        return [child]
      }
    }

    return
  }
}
