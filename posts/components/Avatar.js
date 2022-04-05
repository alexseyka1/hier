class Avatar extends Hier.BaseComponent {
  render() {
    const { username, size = 32 } = this.props
    const url = `https://i.pravatar.cc/${size}?u=${username}`

    return html`<img src="${url}" alt="${username}" width="${size}" height="${size}" class="rounded-circle" />`
  }
}
