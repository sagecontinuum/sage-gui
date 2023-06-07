import styled from 'styled-components'
import { Outlet } from 'react-router-dom'

import Tabber from '/components/tabs/Tabber'

import NodesIcon from '@mui/icons-material/HubOutlined'
import SensorIcon from '@mui/icons-material/SensorsRounded'



const tabs = [{
  label: 'Nodes',
  icon: <NodesIcon />,
  to: '/nodes'
}, {
  label: 'Sensors',
  icon: <SensorIcon />,
  to: '/sensors'
}]


export default function NodeTabs() {
  return (
    <Root>
      <Tabber
        defaultValue={'/nodes'}
        ariaLabel="node and sensor tabs"
        tabs={tabs}
      />
      <Outlet />
    </Root>
  )
}

const Root = styled.div`
  margin: 0 10px 10px 10px;
`
