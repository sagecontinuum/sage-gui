import React from 'react'
import styled from 'styled-components'
import {
  useParams,
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
  let { view } = useParams()


  return (
    <Root>
      <Sidebar />

      <Container>
        <Switch>
          <PrivateRoute path={`${path}/my-apps`} component={AppList} />
          <PrivateRoute path={`${path}/create-app`} component={CreateApp} />

          {view && view.split('/').length == 4 &&
            <App app={view.split('/').slice(1).join('/')} />
          }
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