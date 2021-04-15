import React from 'react'
import { Route } from 'react-router-dom'

import * as Auth from './auth'


function redirect(urlPath: string) {
  // use .replace() to avoid duplicate history for globus auth
  window.location.replace(urlPath)
}


export default function PrivateRoute({render: Render = null, component: Component = null, ...rest}) {
  return (
    <Route
      {...rest}
      render={(props) => Auth.isSignedIn()
        ? (Render ? Render(props) : <Component {...props} />)
        : redirect(`/login/?redirect=${rest.path}`)
      }
    />
  )
}