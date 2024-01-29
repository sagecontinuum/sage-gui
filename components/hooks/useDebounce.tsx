/* 
 * A highly optimized and practical debounce for react
 * Great article: https://www.developerway.com/posts/debouncing-in-react
 */ 

import { useMemo, useEffect, useRef } from 'react'
import debounce from 'lodash/debounce'

type Callback = () => void

const useDebounce = (callback: Callback) => {
  const ref = useRef<Callback>()

  useEffect(() => {
    ref.current = callback
  }, [callback])

  const debouncedCallback = useMemo(() => {
    const func = () => {
      ref.current?.()
    }

    return debounce(func, 300)
  }, [])

  return debouncedCallback
}

export default useDebounce