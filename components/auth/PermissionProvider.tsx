import { createContext, useContext, useState, useEffect} from 'react'
import * as User from '/components/apis/user'


const PermissionContext = createContext(null)


function PermissionProvider(props) {
  const [isSuper, setIsSuper] = useState<boolean>()

  useEffect(() => {
    // todo(nc): extend to other permissions
    User.getUserDetails()
      .then(user => setIsSuper(user.is_superuser))
      .catch(() => setIsSuper(false))
  }, [])


  return (
    <PermissionContext.Provider value={{isSuper}}>
      {props.children}
    </PermissionContext.Provider>
  )
}


function useIsSuper() {
  const context = useContext(PermissionContext)
  if (context == undefined) {
    throw new Error('useIsSuper must be used within a PermissionProvider')
  }
  return context
}


export {
  PermissionProvider,
  useIsSuper
}
