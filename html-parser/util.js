const Util = {
  DIFF_STATES: {
    created: "created",
    changed: "changed",
    deleted: "deleted",
  },

  /**
   * @param {string} state
   * @param {*} value
   */
  DiffResult: function (state, value) {
    this.state = state
    if (arguments.hasOwnProperty(1)) {
      this.value = value
    }
  },

  getIsClass: function (callable) {
    if (typeof callable !== "function") return false
    return /^class *\w+.*{/.test(callable)
  },

  /**
   * @param {object} firstObj
   * @param {object} secondObj
   * @returns {object}
   */
  getObjectDiff: (firstObj, secondObj) => {
    const diffObj = {}
    /**
     * STEP 1
     * Looking for changed or deleted props
     */
    Object.entries(firstObj).map(([key, value]) => {
      /** Value was deleted */
      if (!secondObj.hasOwnProperty(key)) {
        diffObj[key] = new Util.DiffResult(Util.DIFF_STATES.deleted)
        return
      }

      /** Type was changed */
      if (typeof value !== typeof secondObj[key]) {
        diffObj[key] = new Util.DiffResult(Util.DIFF_STATES.changed, secondObj[key])
        return
      }

      if (typeof value === "object") {
        if (value === null && secondObj[key] !== null) {
          /** If one of compared values is null */
          diffObj[key] = new Util.DiffResult(Util.DIFF_STATES.changed, secondObj[key])
          return
        } else if (value === null || secondObj[key] === null) {
          diffObj[key] = new Util.DiffResult(Util.DIFF_STATES.changed, null)
          return
        }

        /** Recursion */
        let nestedObjDiff = Util.getObjectDiff(value, secondObj[key])
        if (Object.values(nestedObjDiff).length) {
          diffObj[key] = nestedObjDiff
        }
        return
      }

      /** Casting symbols to strings */
      if (typeof value === "symbol") value = value.toString()
      if (typeof secondObj[key] === "symbol") secondObj[key] = secondObj[key].toString()

      /** Value was changed */
      if (value !== secondObj[key]) {
        diffObj[key] = new Util.DiffResult(Util.DIFF_STATES.changed, secondObj[key])
      }
    })

    /** STEP 2
     * Looking for the new ones
     */
    Object.entries(secondObj).map(([key, value]) => {
      if (firstObj.hasOwnProperty(key)) return
      diffObj[key] = new Util.DiffResult(Util.DIFF_STATES.created, value)
    })

    return diffObj
  },

  /**
   * @param {Function} callable
   * @returns {string[]}
   */
  getFunctionParamNames: (callable) => {
    if (typeof callable !== "function") throw new Error("Specified argument is not a function.")

    const renderFuncSign = callable.toString()
    const match = renderFuncSign.match(/^(?:function\s*)?\((.*)\)/)

    if (!match) return []

    const paramsString = match[1].trim()
    const paramsList = paramsString.split(/,\s*/)
    return paramsList.reduce((res, item) => {
      const match = item.match(/^\w+\b/)
      if (match) {
        res.push(match[0])
      }
      return res
    }, [])
  },
}
