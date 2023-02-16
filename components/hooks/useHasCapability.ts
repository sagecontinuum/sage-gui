import { useState, useEffect } from 'react'
import * as User from '../apis/user'


export default function useHasCapability(perm: User.AccessPerm) {
  const [hasCapability, setHasCapability] = useState<boolean>()

  useEffect(() => {
    User.hasCapability(perm)
      .then(res => setHasCapability(res))
      .catch(() => setHasCapability(false))
  }, [perm])

  return {hasCapability}
}
