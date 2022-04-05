class StoreProvider extends Hier.BaseComponent {
  render() {
    const { store, children } = this.props
    if (!store) return children ? children : null
    return "STORE"
  }
}
