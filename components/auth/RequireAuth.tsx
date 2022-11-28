import { Navigate } from 'react-router-dom'
import Auth from './auth'
const isSignedIn = Auth.isSignedIn


export default function RequireAuth({children}) {
  if (process.env.NODE_ENV == 'development') {
    return isSignedIn ? children :
      <Navigate to="/login" replace />
  }

  if (isSignedIn)
    return children

  window.location.href = `${Auth.url}/?callback=${window.location.href}`
}