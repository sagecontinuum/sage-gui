import { useState, useEffect } from 'react'
import * as User from '/components/apis/user'


export default function useIsStaff() {
  const [isStaff, setIsStaff] = useState<boolean>()

  useEffect(() => {
    User.getUserDetails()
      .then(user => setIsStaff(user.is_staff))
      .catch(() => setIsStaff(false))
  }, [])

  return {isStaff}
}
