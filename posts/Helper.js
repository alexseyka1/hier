const Helper = {
  queryParams: {
    /**
     * Parses query params from URI string and returns params object
     * @param {string} string
     * @returns
     */
    fromString: function (string) {
      if (!string) string = window.location.search
      return string
        .substring(1)
        .split("&")
        .reduce((result, item) => {
          const [param, value] = item.split("=")
          return { ...result, [param]: value }
        }, {})
    },
    toString: function (params) {
      if (typeof params !== "object") return ""
      return Object.entries(params)
        .map(([param, value]) => {
          value = encodeURIComponent(value)
          return `${param}=${value}`
        })
        .join("&")
    },
  },
}
