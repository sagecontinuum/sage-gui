import React from 'react'
import { Route } from 'react-router-dom'

import * as Auth from './auth'
const _isSignedIn = Auth.isSignedIn()


function redirect(urlPath: string) {
  // use .replace() to avoid duplicate history for globus auth
  window.location.replace(urlPath)
}


export default function PrivateRoute({
  component: Component = null,
  ...rest
}) {
  return (
    <Route
      {...rest}
      render={props => (
        _isSignedIn ?
          Component ? <Component {...props} /> : rest.render(props)
          : redirect(`${Auth.url}/?callback=${window.location.origin}${rest.path}`)
      )}
    />
  )
}