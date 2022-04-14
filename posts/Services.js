const Services = (function () {
  const store = {
    posts: new Map(),
    users: new Map(),
    comments: new Map(),
  }
  let usersLoaded

  const getRandomInt = (from, to) => Math.floor(Math.random() * +to) + +from

  const simulateDownloadingDelay = (response, delayMs = 250) => {
    return new Promise((resolve) => {
      const randomDelay = getRandomInt(delayMs / 2, delayMs * 2)
      setTimeout(() => resolve(response), randomDelay)
    })
  }

  const fetchPosts = async () => {
    return simulateDownloadingDelay(Database.posts)
  }
  const fetchPost = async (id) => {
    for (let post of Database.posts) {
      if (+post.id === +id) return simulateDownloadingDelay(post)
    }
    return null
  }
  const fetchUser = async (id) => {
    if (!id) return simulateDownloadingDelay(Database.users)
    for (let user of Database.users) {
      if (+user.id === +id) return simulateDownloadingDelay(user)
    }
    return null
  }
  const fetchComments = async (postId) => {
    const response = Database.comments.filter((comment) => +comment.postId === +postId)
    return simulateDownloadingDelay(response)
  }
  const fetchAlbums = async () => {
    return simulateDownloadingDelay(Database.albums)
  }

  const _getAllPosts = async () => {
    if (!store.posts.size) {
      const fetchedList = await fetchPosts()
      for (let post of fetchedList) {
        store.posts.set(+post.id, post)
      }
    }

    return Array.from(store.posts.values()).sort((a, b) => a.id - b.id)
  }

  const posts = {
    getPosts: _getAllPosts,

    getPost: async (id) => {
      id = +id
      if (!store.posts.size) setTimeout(() => posts.getPosts())
      if (!store.posts.has(id)) {
        store.posts.set(id, await fetchPost(id))
      }

      const { title, body, userId } = store.posts.get(id)
      const user = await users.getUser(userId)
      const userData = {
        id,
        title,
        body,
        user: {
          ...user,
          avatarUrl: `https://i.pravatar.cc/64?u=${user.id}`,
        },
      }

      return simulateDownloadingDelay(userData)
    },

    getPostsByUser: async (id) => {
      const posts = await _getAllPosts()
      const response = posts.filter((post) => +post.userId === +id)
      return simulateDownloadingDelay(response)
    },
  }

  const users = {
    getUsers: async () => {
      if (!usersLoaded) {
        const fetchedList = await fetchUser()
        for (let user of fetchedList) {
          store.users.set(user.id, user)
          usersLoaded = true
        }
      }

      return Array.from(store.users.values()).sort((a, b) => a.id - b.id)
    },

    getUser: async (id) => {
      id = +id
      if (!store.users.size) setTimeout(() => users.getUsers())
      if (!store.users.has(id)) {
        store.users.set(id, await fetchUser(id))
      }

      const user = store.users.get(id)
      const userData = {
        ...user,
        avatarUrl: `https://i.pravatar.cc/256?u=${user.id}`,
      }

      return simulateDownloadingDelay(userData)
    },
  }

  const comments = {
    getComments: async (postId) => {
      if (!store.comments.has(postId)) {
        store.comments.set(postId, await fetchComments(postId))
      }

      return store.comments.get(postId)
    },
  }

  const albums = {
    getAlbumsByUser: async (id) => {
      const albums = await fetchAlbums()
      const response = albums.filter((album) => +album.userId === +id)
      return simulateDownloadingDelay(response)
    },
  }

  return {
    posts,
    users,
    comments,
    albums,
  }
})()
