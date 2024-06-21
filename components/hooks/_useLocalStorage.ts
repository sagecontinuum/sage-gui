/**
 * an unused, untested implmentation of storing some settings
 */


import {useState, useEffect, useMemo} from 'react'


type StorageEntries = 'uiSettings'

type defaultSettings = {
  uiSettings: UISettings
}

type UISettings = {
  exampleState: boolean
}

type UISettingsKeys = 'someKey'

const defaultSettings = {
  uiSettings: {
    exampleState: false,
  }
}



function useLocalStorage (storageKey: StorageEntries, key: UISettingsKeys) {

  const initial = useMemo(() => {
    const jsonStr = localStorage.getItem(storageKey)
    // todo: throw runtime error if defaults aren't there?

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