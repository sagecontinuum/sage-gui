import styled from 'styled-components'
import { Outlet } from 'react-router-dom'

import Sidebar from '../Sidebar'

export default function Apps() {
  return (
    <Root>
      <Sidebar />

      <Main>
        <Outlet />
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