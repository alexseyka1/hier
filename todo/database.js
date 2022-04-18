const Database = (function () {
  const openConnection = (storeName) => {
    return new Promise((resolve, reject) => {
      window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
      window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction
      window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange

      const DBOpenRequest = window.indexedDB.open(storeName, 1)

      DBOpenRequest.onerror = function (event) {
        reject(event)
      }

      DBOpenRequest.onsuccess = function (event) {
        console.debug("Database initialised.")
        db = DBOpenRequest.result
        resolve(db)
      }

      DBOpenRequest.onupgradeneeded = function (event) {
        let db = event.target.result

        db.onerror = function (event) {
          reject("Error loading database.")
        }

        // Create an objectStore for this database
        let objectStore = db.createObjectStore(storeName, { keyPath: "id" })

        // define what data items the objectStore will contain
        objectStore.createIndex("title", "title", { unique: false })
        objectStore.createIndex("isDone", "isDone", { unique: false })
        objectStore.createIndex("sortPosition", "sortPosition", { unique: false })

        console.debug("Object store created.")
      }
    })
  }

  return {
    openConnection,
  }
})()
