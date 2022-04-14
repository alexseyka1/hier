class AlbumListItem extends Hier.Component {
  constructor(props) {
    super(props)
    this._state = {}
  }

  render() {
    const { album, onSelect } = this.props
    if (!album) return null

    const onSelected = (e, album) => {
      e.preventDefault()
      if (typeof onSelect === "function") onSelect(album)
    }

    const photoSize = 512
    const linkHref = `?#album/${album.id}`
    const photoUrl = `https://i.pravatar.cc/${photoSize}?u=${album.title}`

    return html`<div class="card rounded-0">
      <img src=${photoUrl} class="card-img-top rounded-0" />

      <div class="card-body">
        <p class="card-text">${album.title.repeat(3)}</p>
        <div class="d-flex justify-content-between align-items-center">
          <a
            href=""
            class="btn btn-sm btn-outline-primary stretched-link"
            onClick=${(e) => onSelected(e, album)}
            href=${linkHref}
          >
            View Album
          </a>
          <small class="opacity-25">#${album.id}</small>
        </div>
      </div>
    </div>`
  }
}
