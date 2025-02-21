
const keys = [
  'sage_username',
  'sage-table-columns-/nodes',
  'sage-table-columns-/all-nodes',
  'sage-table-columns-/sensors',
  'sage-table-columns-task-listing',
  'sage-assistant'
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


function onChange(key: string, callback: () => void) {
  window.addEventListener('storage', event => {
    if (event.key !== key)
      return

    if (event.newValue == null)
      callback()
  })
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
  rm,
  onChange
}