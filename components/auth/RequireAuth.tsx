import { Navigate } from 'react-router-dom'
import * as Auth from './auth'
const _isSignedIn = Auth.isSignedIn()


export default function RequireAuth({children}) {
  if (process.env.NODE_ENV == 'development') {
    return _isSignedIn ? children :
      <Navigate to="/login" replace />
  }

  if (_isSignedIn)
    return children

  window.location.href = `${Auth.url}/?callback=${window.location.href}`
}