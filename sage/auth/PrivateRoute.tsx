import React from 'react'
import { Route, Redirect } from 'react-router-dom'

import * as Auth from './auth'


export default function PrivateRoute({render: Render = null, component: Component = null, ...rest}) {
  return (
    <Route
      {...rest}
      render={(props) => Auth.isSignedIn()
        ? (Render ? Render(props) : <Component {...props} />)
        : <Redirect to={`/login?redirect=${rest.path}`} />}
    />
  )
}