const DIFF_STATES = {
  created: "created",
  changed: "changed",
  deleted: "deleted",
}
/**
 * @param {string} state
 * @param {*} value
 */
function DiffResult(state, value) {
  this.state = state
  if (arguments.hasOwnProperty(1)) {
    this.value = value
  }
}

/**
 * @param {object} firstObj
 * @param {object} secondObj
 * @returns {object}
 */
const objectDiff = (firstObj, secondObj) => {
  const diffObj = {}
  /**
   * STEP 1
   * Looking for changed or deleted props
   */
  Object.entries(firstObj).map(([key, value]) => {
    /** Value was deleted */
    if (!secondObj.hasOwnProperty(key)) {
      diffObj[key] = new DiffResult(DIFF_STATES.deleted)
      return
    }

    /** Type was changed */
    if (typeof value !== typeof secondObj[key]) {
      diffObj[key] = new DiffResult(DIFF_STATES.changed, secondObj[key])
      return
    }

    if (typeof value === "object") {
      if (JSON.stringify(value) === JSON.stringify(secondObj[key])) {
        return
      }

      if (value === null && secondObj[key] !== null) {
        /** If one of compared values is null */
        diffObj[key] = new DiffResult(DIFF_STATES.changed, secondObj[key])
        return
      } else if (value === null || secondObj[key] === null) {
        diffObj[key] = new DiffResult(DIFF_STATES.changed, null)
        return
      }

      /** Recursion */
      let nestedObjDiff = objectDiff(value, secondObj[key])
      diffObj[key] = nestedObjDiff
      return
    }

    /** Casting symbols to strings */
    if (typeof value === "symbol") value = value.toString()
    if (typeof secondObj[key] === "symbol") secondObj[key] = secondObj[key].toString()

    /** Value was changed */
    if (value !== secondObj[key]) {
      diffObj[key] = new DiffResult(DIFF_STATES.changed, secondObj[key])
    }
  })

  /** STEP 2
   * Looking for the new ones
   */
  Object.entries(secondObj).map(([key, value]) => {
    if (firstObj.hasOwnProperty(key)) return
    diffObj[key] = new DiffResult(DIFF_STATES.created, value)
  })

  return diffObj
}
