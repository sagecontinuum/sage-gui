import React from 'react'
import styled from 'styled-components'
import { useParams} from 'react-router-dom'

import Sidebar from './Sidebar'
import AppList from './AppList'
import CreateApp from './CreateApp'


type Props = {

}

export default function (props: Props) {

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