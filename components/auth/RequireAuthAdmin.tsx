import styled from 'styled-components'
import { Navigate } from 'react-router-dom'

import useIsStaff from '/components/hooks/useIsStaff'
import Auth from './auth'
const isSignedIn = Auth.isSignedIn


// Besides requiring a token, check django's "is_staff".
// Note: this is simply for UX, not an auth/security feature
export default function RequireAuthAdmin({children}) {
  const {isStaff} = useIsStaff()

  if (isSignedIn && !isStaff)
    return (
      <Container className="flex items-center justify-center">
        This view is intended for Sage/Waggle staff.
        Please contact us if you think this is a mistake.
      </Container>
    )

  if (process.env.NODE_ENV == 'development') {
    return isSignedIn ? children :
      <Navigate to="/login" replace />
  }

  if (isSignedIn && isStaff)
    return children

  window.location.href = `${Auth.url}/?callback=${window.location.href}`
}

const Container = styled.div`
  color: #666;
  width: 50%;
`

