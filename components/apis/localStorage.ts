
const keys = [
  'sage-table-columns-/nodes',
  'sage-table-columns-/all-nodes',
  'sage-table-columns-/sensors'
]


function get(key: string) {
  return localStorage.getItem(key)
}


function set<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data))
}


function rm(key: string) {
  localStorage.removeItem(key)
}


// todo(nc): clean based on routes, or something like that
function _clean() {
  for (const key in localStorage){
    if (!keys.includes(key))
      rm(key)
  }
}

_clean()

export {
  get,
  set,
  rm
}