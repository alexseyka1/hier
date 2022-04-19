class AlbumPage extends Hier.Component {
  _state = {
    album: null,
    photos: [],
    selectedPhotoUrl: null,
  }

  afterMount() {
    const { id } = this.props
    if (!id) return
    this.fetchAlbum(id)
  }

  fetchAlbum(id) {
    Services.albums.getAlbum(id).then((album) => this.setState({ album }))
    Services.photos.getAlbumPhotos(id).then((photos) => this.setState({ photos }))
  }

  afterUpdate(props, prevProps) {
    if (+props.id === +prevProps.id) return

    const { id } = this.props
    if (!id) this.setState({ album: null, photos: [], selectedPhotoUrl: null })
    this.fetchAlbum(id)
  }

  getUserBlock(userId) {
    if (!userId) return

    return html`<a href="?#user/${userId}" class="btn d-block rounded-0 p-0 border-0 text-start"
      ><h5 class="m-0 px-3 py-3 bg-light border-bottom">
        <${UserName} id=${userId} avatarSize="48" /></h5
    ></a>`
  }

  openPreview(url) {
    this.setState({ selectedPhotoUrl: url })
  }

  getPhotosBlock() {
    const { photos } = this.state
    if (!photos && !photos.length) return html`<${Loader} />`

    return html`<div class="row row-cols-3 row-cols-lg-4 row-cols-xl-5 m-0 my-3">
      ${photos.map((photo) => {
        const photoSize = 256
        const photoUrl = `https://i.pravatar.cc/${photoSize}?u=${photo.title}`
        const largePhotoUrl = `https://i.pravatar.cc/1024?u=${photo.title}`

        return html`<div class="p-0 position-relative">
          <${Loader} class="position-absolute d-flex justify-content-center align-items-center w-100 h-100" />
          <div
            onClick="${() => this.openPreview(largePhotoUrl)}"
            title="${photo.title}"
            class="card rounded-0"
            style="background-color: transparent; background-repeat: no-repeat;
        background-size: cover; aspect-ratio: 1; background-image: url('${photoUrl}')"
          ></div>
        </div>`
      })}
    </div>`
  }

  getPreviewBlock() {
    const { selectedPhotoUrl } = this.state
    const onClose = (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.setState({ selectedPhotoUrl: null })
    }
    const onClickImage = (e) => {
      e.preventDefault()
      e.stopPropagation()
    }
    const _class = `album-page__preview ${selectedPhotoUrl ? "active" : ""}`

    return html`<div class=${_class} onClick=${(e) => onClose(e)}>
      <${Loader} />
      ${selectedPhotoUrl ? html`<img src=${selectedPhotoUrl} onClick=${(e) => onClickImage(e)} />` : ""}
      <span class="fa fa-2x fa-close close-btn" onClick=${(e) => onClose(e)}></span>
    </div>`
  }

  render() {
    const { album } = this.state
    if (!album) return html`<${Loader} />`

    const userBlock = this.getUserBlock(album.userId)
    const photosBlock = this.getPhotosBlock(album.id)
    const previewBlock = this.getPreviewBlock()
    const photoSize = 512
    const photoUrl = `https://i.pravatar.cc/${photoSize}?u=${album.title}`

    return html`<div class="container">
      ${previewBlock}

      <div class="bg-white">
        ${userBlock}

        <div class="card border-0 rounded-0">
          <div class="row g-0">
            <div class="col-md-4">
              <img src=${photoUrl} class="img-fluid rounded-0" />
            </div>
            <div class="col-md-8">
              <div class="card-body">
                <h5 class="card-title">${album.title.repeat(3)}</h5>
                <p class="card-text">
                  This is a wider card with supporting text below as a natural lead-in to additional content. This
                  content is a little bit longer.
                </p>
                <p class="card-text"><small class="text-muted">Last updated 3 mins ago</small></p>
              </div>
            </div>
          </div>
        </div>

        ${photosBlock}
      </div>
    </div>`
  }
}
