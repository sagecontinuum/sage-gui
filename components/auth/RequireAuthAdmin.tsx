import styled from 'styled-components'
import { Navigate, Outlet } from 'react-router-dom'

import useIsStaff from '/components/hooks/useIsStaff'
import Auth from './auth'
import config from '/config'

const { contactUs } = config
const isSignedIn = Auth.isSignedIn


// Besides requiring a token, check django's "is_staff".
// Note: this is simply for UX, not an auth/security feature
export default function RequireAuthAdmin() {
  const {isStaff} = useIsStaff()

  // wait for isStaff fetch
  if (isStaff == undefined)
    return <></>

  if (isSignedIn && !isStaff)
    return (
      <Notice className="flex items-center justify-center">
        <p>
          This view is intended for Sage/Waggle staff.
          Please <b><a href={contactUs}>contact us</a></b> if you think this is a mistake.
        </p>
      </Notice>
    )

  if (process.env.NODE_ENV == 'development') {
    return isSignedIn ? <Outlet /> : <Navigate to="/login" replace />
  } else if (isSignedIn) {
    return <Outlet />
  } else {
    window.location.href = `${Auth.url}/?callback=${window.location.href}`
  }
}

const Notice = styled.div`
  color: #666;
  height: 50%;
`

