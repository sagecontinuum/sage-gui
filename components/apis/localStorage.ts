// keys to be kept in localStorage, all other keys will be removed on load.
// the goal currently is to prevent stale data from old versions
// of the app while keeping localStorage clean.
const keys = [
  'sage_username',
  'sage-table-columns-/nodes',
  'sage-table-columns-/all-nodes',
  'sage-table-columns-/sensors',
  'sage-table-columns-task-listing',
  'sage-edgerunner',
  'mui-color-scheme-dark',
  'mui-color-scheme-light',
  'mui-mode',
  'is-new-ignored-items-v1',
  'nodes.sidebar.state',

  // todo(nc): refactor into individual app states
  'metrics.sidebar.state'
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