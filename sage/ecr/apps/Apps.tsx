import React from 'react'
import styled from 'styled-components'
import {
  useRouteMatch,
  Switch,
  Route
} from 'react-router-dom'

import Sidebar from '../Sidebar'
import AppList from './AppList'
import App from '../app/App'
import CreateApp from '../create-app/CreateApp'

import PrivateRoute from '~/components/auth/PrivateRoute'


export default function Apps() {
  let { path } = useRouteMatch()

  return (
    <Root>
      <Sidebar />

      <Main>
        <Switch>
          <Route path={`${path}/explore`} component={AppList} />
          <Route path={`${path}/app/:path*`} component={App}/>
          <PrivateRoute path={`${path}/my-apps`} component={AppList} />
          <PrivateRoute path={`${path}/shared-with-me`} component={AppList} />
          <PrivateRoute path={`${path}/create-app`} component={CreateApp} />
        </Switch>
      </Main>
    </Root>
  )
}


const Root = styled.div`
  display: flex;
  height: 100%;
`

const Main = styled.div`
  padding: 0 20px;
  flex-grow: 1;
  overflow-y: auto;
`