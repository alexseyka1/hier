const Service = (function () {
  const insertItem = (storeName, itemToInsert) => {
    return new Promise((resolve, reject) => {
      Database.openConnection(storeName).then((db) => {
        let transaction = db.transaction([storeName], "readwrite")
        let objectStore = transaction.objectStore(storeName)
        objectStore.add(itemToInsert)

        transaction.oncomplete = () => {
          resolve()
        }
        transaction.onerror = () => reject(transaction.error)
      })
    })
  }

  const dropItem = (storeName, itemToRemove) => {
    return new Promise((resolve, reject) => {
      Database.openConnection(storeName).then((db) => {
        let transaction = db.transaction([storeName], "readwrite")
        transaction.objectStore(storeName).delete(itemToRemove.id)
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction)
      })
    })
  }

  const updateItems = (storeName, itemsToUpdate) => {
    return new Promise((resolve, reject) => {
      Database.openConnection(storeName).then((db) => {
        let transaction = db.transaction([storeName], "readwrite")
        const objectStore = transaction.objectStore(storeName)
        itemsToUpdate.map((item) => objectStore.put(item))
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction)
      })
    })
  }

  const getItems = (storeName, direction) => {
    return new Promise((resolve, reject) => {
      Database.openConnection(storeName).then((db) => {
        const readItems = []
        let objectStore = db.transaction(storeName).objectStore(storeName)

        objectStore.index("sortPosition").openCursor(null, direction).onsuccess = (event) => {
          const cursor = event.target.result
          if (cursor) {
            readItems.push(TodoItem.fromDb(cursor.value))
            cursor.continue()
          } else if (readItems.length) {
            resolve(readItems)
          }
        }
      })
    })
  }

  return {
    insertItem,
    dropItem,
    updateItems,
    getItems,
  }
})()
