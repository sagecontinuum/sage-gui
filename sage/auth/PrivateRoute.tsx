import React from 'react'
import { Route, Redirect } from 'react-router-dom'

import * as Auth from './auth'

export default function PrivateRoute({component: Component, ...rest}) {
  return (
    <Route
      {...rest}
      render={(props) => Auth.isSignedIn()
        ? <Component {...props} />
        : <Redirect to={`/login?redirect=${rest.path}`} />}
    />
  )
}