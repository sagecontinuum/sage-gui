import React from 'react'
import styled from 'styled-components'
import { useParams} from 'react-router-dom'

import Sidebar from './Sidebar'
import AppList from './AppList'
import App from './App'
import CreateApp from './CreateApp'


export default function Apps() {
  let { view } = useParams()

  return (
    <Root>
      <Sidebar />

      <Container>
        {view == 'my-apps' &&
          <AppList />
        }
        {view == 'create-app' &&
          <CreateApp />
        }
        {view.split('/').length == 4 &&
          <App app={view.split('/').slice(1).join('/')} />
        }
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