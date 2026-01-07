import styled from 'styled-components'
import { Outlet } from 'react-router-dom'

import Tabber from '/components/tabs/Tabber'
import { Card, CardViewStyle } from '/components/layout/Layout'

// import DevicesIcon from '@mui/icons-material/DeviceHubRounded'


const tabs = [{
  label: 'Overview',
  to: '/metrics/overview'
}, {
  label: 'Count by Filters',
  to: '/metrics/filters'
}]


export default function Metrics() {

  return (
    <Root>
      {CardViewStyle}

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