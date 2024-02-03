import { useState, useEffect } from 'react'
import * as User from '/components/apis/user'


export default function useIsSuper() {
  const [isSuper, setIsSuper] = useState<boolean>()

  useEffect(() => {
    User.getUserDetails()
      .then(user => {
        setIsSuper(user.is_superuser)
      })
      .catch(() => setIsSuper(false))
  }, [])

  return {isSuper}
}
