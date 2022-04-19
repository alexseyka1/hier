class TodoItem {
  constructor(title = Hier.isRequired(), id = Hier.isRequired()) {
    this.id = id
    this.title = title
    this.isDone = false
    this.sortPosition = id
  }

  static fromDb(dbItem) {
    const item = new TodoItem(dbItem.title, dbItem.id)
    item.isDone = !!dbItem.isDone
    item.sortPosition = dbItem.sortPosition
    return item
  }
}
