class ItemsList extends Hier.BaseComponent {
  render() {
    const { items, onToggleDone, onClickRemove } = this.props

    return items.map(
      (item) => html`<div
        class="glass-bg border-bottom d-flex justify-content-between align-items-start"
        key=${item.id}
      >
        <div
          class="py-2 ps-3 pe-2 fs-4 toggle-button ${!!item.isDone ? "text-success" : "text-secondary opacity-25"}"
          onClick=${() => onToggleDone(item)}
        >
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <div class="w-100 py-2 my-1 ${!!item.isDone ? "text-decoration-line-through" : ""}">${item.title}</div>
        <div class="py-2 pe-3 ps-2 mt-1 text-danger opacity-25" onClick=${() => onClickRemove(item)}>
          <span class="fa fa-close"></span>
        </div>
      </div>`
    )
  }
}
