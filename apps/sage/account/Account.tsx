import styled from 'styled-components'
import { Outlet, NavLink, useLocation } from 'react-router-dom'

import Tabber from '/components/tabs/Tabber'
import { Card, CardViewStyle } from '/components/layout/Layout'

import AccountIcon from '@mui/icons-material/AccountCircleRounded'
import NodesIcon from '@mui/icons-material/HubOutlined'
import DevicesIcon from '@mui/icons-material/Devices'


const tabs = [{
  label: 'Account',
  icon: <AccountIcon fontSize="small" />,
  to: '/account/profile'
}, {
  label: 'Nodes',
  icon: <NodesIcon fontSize="small" />,
  to: '/account/nodes'
}, {
  label: 'Devices',
  icon: <DevicesIcon fontSize="small" />,
  to: '/account/devices'
}]


export default function Account() {

  return (
    <Root>
      <CardViewStyle />

      <Card>
        <Tabber
          defaultValue={'/accounts/profile'}
          aria-label="my account tabs"
          tabs={tabs}
        />
        <br/>

        <Outlet />

      </Card>
    </Root>
  )
}

const Root = styled.div`
  margin: 40px 100px 500px 100px;
`
