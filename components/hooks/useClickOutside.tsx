import {useEffect} from 'react'



export default function useClickOutside(
  ref: {current: HTMLElement},
  callback: () => void,
  except: string | string[] = 'button'
) {
  useEffect(() => {
    function handleClickOutside(event) {
      if (except &&
        (Array.isArray(except) ? except : [except])
          .filter(tag => event.target.closest(tag)).length
      ) {
        return
      }


      if (ref.current && !ref.current.contains(event.target))
        callback()
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [ref, callback, except])
}
