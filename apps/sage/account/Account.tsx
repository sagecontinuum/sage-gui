import styled from 'styled-components'
import { Outlet } from 'react-router-dom'

import Tabber from '/components/tabs/Tabber'
import { Card, CardViewStyle } from '/components/layout/Layout'

import AccountIcon from '@mui/icons-material/AccountCircleRounded'
import NodesIcon from '@mui/icons-material/HubOutlined'
import AccessIcon from '@mui/icons-material/LockOutlined'
import DevicesIcon from '@mui/icons-material/DeviceHubRounded'


const tabs = [{
  label: 'Account',
  icon: <AccountIcon />,
  to: '/account/profile'
}, {
  label: 'Shared Nodes',
  icon: <NodesIcon />,
  to: '/account/nodes'
}, {
  label: 'Access Credentials',
  icon: <AccessIcon />,
  to: '/account/access'
}, {
  label: 'My Nodes',
  icon: <DevicesIcon />,
  to: '/account/my-nodes'
}]


export default function Account() {

  return (
    <Root>
      <CardViewStyle />

      <Card>
        <Tabber
          defaultValue={'/accounts/profile'}
          ariaLabel="my account tabs"
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
