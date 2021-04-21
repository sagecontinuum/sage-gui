import React from 'react'
import styled from 'styled-components'
import {
  useRouteMatch,
  Switch,
  Route
} from 'react-router-dom'

import Sidebar from './Sidebar'
import AppList from './AppList'
import App from './App'
import CreateApp from './CreateApp'

import PrivateRoute from '../auth/PrivateRoute'


export default function Apps() {
  let { path } = useRouteMatch()

  return (
    <Root>
      <Sidebar />

      <Container>
        <Switch>
          <PrivateRoute path={`${path}/my-apps`} component={AppList} render={() => <AppList view="myApps" />} />
          <PrivateRoute path={`${path}/shared-with-me`} render={() => <AppList view="sharedWithMe" />} />
          <PrivateRoute path={`${path}/create-app`} component={CreateApp} />

          <Route path={`${path}/app/:path*`} component={App}/>
        </Switch>
      </Container>
    </Root>
  )
}


const Root = styled.div`
  display: flex;
  height: 100%;
`

const Container = styled.div`
  padding: 20px;
  flex-grow: 1;
  overflow-y: auto;
`