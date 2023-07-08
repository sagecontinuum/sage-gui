import { useState, useEffect } from 'react'
import * as User from '/components/apis/user'


export default function useIsApproved() {
  const [isApproved, setIsApproved] = useState<boolean>()

  useEffect(() => {
    User.getUserDetails()
      .then(user => setIsApproved(user.is_approved))
      .catch(() => setIsApproved(false))
  }, [])

  return {isApproved}
}
