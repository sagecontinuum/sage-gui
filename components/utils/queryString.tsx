
type Opts<T> =  {
  initialState?: T,
  exclude?: string[]
  multiple?: false
}


// basic query string parser, supporting double quoted, comma separated lists
export function parseQueryStr<T>(params: URLSearchParams, opts?: Opts<T>) {
  const {initialState, exclude, multiple = true} = opts || {}

  const obj = {...initialState} || {}
  params.forEach((v, k) => {

    if (initialState && !Object.keys(initialState).includes(k)) {
      return
    }

    if (exclude?.includes(k)) {
      return
    }

    if (multiple) {
      try {
        // if val is a valid list of quoted strings, parse using json parser
        obj[k] = JSON.parse(`[${v}]`)
      } catch {
        // otherwise store as is
        obj[k] = [v]
      }
    } else {
      obj[k] = v
    }


  })

  return obj as T
}