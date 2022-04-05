class Base {
  _state = {}

  constructor(defaultValue) {
    Object.defineProperty(this, "_state", {
      configurable: false,
      enumerable: false,
      value: defaultValue || {},
    })

    Object.defineProperty(this, "state", {
      configurable: false,
      enumerable: false,
      get: () => {
        return this._state || {}
      },
      set: (currentValue) => {
        const prevState = { ...this._state }
        this._state = currentValue
      },
    })
  }
}
