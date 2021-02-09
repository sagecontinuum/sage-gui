import {useState, useEffect, useMemo} from 'react'


type StorageEntries = 'uiSettings'

type defaultSettings = {
  uiSettings: UISettings
}

type UISettings = {
  showDetails: boolean
  showFilters: boolean
}

type UISettingsKeys =
  'showDetails' |
  'showFilters' |
  'showHiddenFiles'


const defaultSettings = {
  uiSettings: {
    showDetails: false,
    showFilters: true,
    showHiddenFiles: false
  }
}



function useLocalStorage (storageKey: StorageEntries, key: UISettingsKeys) {

  const initial = useMemo(() => {
    const jsonStr = localStorage.getItem(storageKey)
    // todo: throw runtime error if defaults aren't there

    let init
    try {
      init = jsonStr ? JSON.parse(jsonStr) : defaultSettings[storageKey]
    } catch (err) {
      console.warn('useLocalStorage: could not parse object.  Using default settings.')
      init = defaultSettings[storageKey]
    }

    return init
  }, [storageKey])


  const [state, setState] = useState<object>(initial)


  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state))
  }, [storageKey, key, state])


  const storeValue = val => {
    const value =
      val instanceof Function ? val(state[key]) : val

    setState(prev => ({...prev, [key]: value}))
  }

  return [state[key], storeValue]
}



export default useLocalStorage