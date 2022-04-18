class App extends Hier.Component {
  _state = { newItemTitle: "", items: [] }
  STORE_NAME = "todoList"
  SORT_ASC = false

  constructor(props) {
    super(props)
    this.itemsContainer = Hier.createRef()
  }

  addNewItem(title) {
    if (!title) return
    const maxId = this.SORT_ASC
      ? this.state.items.reduce((max, item) => (+item.id > max ? +item.id : max), 0)
      : this.state.items[0]?.id ?? 0
    const newItem = new TodoItem(title, maxId + 1)

    Service.insertItem(this.STORE_NAME, newItem)
      .then(() => {
        if (this.SORT_ASC) this.setState({ items: [...this.state.items, newItem] })
        else this.setState({ items: [newItem, ...this.state.items] })
      })
      .catch((e) => console.error("Failed to add new item to database", e))
  }

  removeItem(itemToRemove) {
    Service.dropItem(this.STORE_NAME, itemToRemove)
      .then(() => {
        const items = this.state.items.filter((item) => +item.id !== +itemToRemove.id)
        this.setState({ items })
      })
      .catch((e) => console.error("Failed to delete item from database", e))
  }

  toggleDoneItem(item) {
    const newTodoItem = TodoItem.fromDb(item)
    newTodoItem.isDone = !item.isDone

    const newItems = this.state.items.map((_item) => {
      if (+_item.id === +item.id) return newTodoItem
      else return _item
    })

    this.updateDbItems([newTodoItem], () => {
      this.setState({ items: newItems })
    })
  }

  updateDbItems(itemsToUpdate, onSuccess) {
    Service.updateItems(this.STORE_NAME, itemsToUpdate)
      .then(() => {
        if (typeof onSuccess === "function") onSuccess()
      })
      .catch((e) => console.error("Failed to update items in database", e))
  }

  afterMount() {
    const ref = this.itemsContainer?.elem

    const direction = this.SORT_ASC ? "next" : "prev"
    Service.getItems(this.STORE_NAME, direction)
      .then((readItems) => {
        this.setState({ items: readItems })
        if (ref) this.initSortList(ref)
      })
      .catch((e) => console.error("Failed to get items from database", e))
  }

  initSortList(target) {
    function reArrangeList(list, from, to) {
      const _list = [...list]
      _list.splice(to, 0, _list.splice(from, 1)[0])
      return _list
    }

    const sortable = new Sortable(target, {
      handle: ".toggle-button",
      ghostClass: "sortable-ghost",
      onEnd: (e) => {
        if (+e.oldIndex !== +e.newIndex) {
          let sortedItems = reArrangeList(this.state.items, e.oldIndex, e.newIndex).map((item, idx) => {
            item.sortPosition = idx
            return item
          })
          if (!this.SORT_ASC) {
            sortedItems = sortedItems.reverse().map((item, idx) => {
              item.sortPosition = idx
              return item
            })
          }

          this.updateDbItems(sortedItems, () => {
            this.state.items = sortedItems
          })
        }
      },
    })
  }

  render() {
    const { newItemTitle, items } = this.state

    const onSubmit = (e) => {
      e.preventDefault()
      this.addNewItem(this.state.newItemTitle)
      this.setState({ newItemTitle: "" })
      e.target.reset()
    }

    const onToggleItem = (item) => this.toggleDoneItem(item)
    const onClickRemove = (item) => this.removeItem(item)

    return html`<div class="main flex-column home-hero w-100">
      <div class="scrollarea container mt-md-5">
        <nav class="topbar bg-white p-3 shadow">
          <form onSubmit=${onSubmit}>
            <div class="input-group">
              <input
                type="text"
                class="form-control rounded-0"
                placeholder="What do you want to do?"
                value=${newItemTitle}
                onInput=${(e) => this.setState({ newItemTitle: e.target.value.trim() })}
                autofocus="true"
              />
              <button class="btn btn-outline-primary rounded-0" type="submit">
                <span class="fa fa-plus me-1"></span>
                Add
              </button>
            </div>
          </form>
        </nav>

        <${ItemsList}
          class="mb-5"
          ref=${this.itemsContainer}
          items=${items}
          onToggleDone=${onToggleItem}
          onClickRemove=${onClickRemove}
        />
      </div>
    </div>`
  }
}
