import styled from 'styled-components'
import { useSearchParams, Link } from 'react-router-dom'

import { Tabs, Tab, tabLabel } from '/components/tabs/Tabs'
import { TabProps } from '@mui/material'

import OverviewIcon from '@mui/icons-material/ListAltRounded'
import SensorIcon from '@mui/icons-material/SensorsRounded'
import ComputesIcon from '@mui/icons-material/DeveloperBoardRounded'
import PeripheralsIcon from '@mui/icons-material/Cable'
import HealthIcon from '@mui/icons-material/MonitorHeartOutlined'
import CellTowerIcon from '@mui/icons-material/CellTower'



// a tab is rendered with react.clone, so we must explicity pass TabProps
const ConditionalTab = (props: TabProps & {show: boolean, component, to, replace}) =>
  props.show ? <Tab {...props} /> : <></>


type Props = {
  admin: boolean
  counts: {[label: string]: number}
  lorawan: boolean
}

export default function ManifestTabs(props: Props) {
  const {admin, counts, lorawan} = props

  const [params] = useSearchParams()
  const tab = params.get('tab') || 'overview'

  return (
    <Root>
      <Tabs
        value={tab}
        aria-label="node details tabs"
      >
        <Tab
          label={tabLabel(<OverviewIcon fontSize="small" />, 'Overview')}
          component={Link}
          value="overview"
          to="?tab=overview"
          replace
        />
        <Tab
          label={tabLabel(<SensorIcon />, 'Sensors', counts)}
          component={Link}
          value="sensors"
          to="?tab=sensors"
          replace
        />
        <Tab
          label={tabLabel(<ComputesIcon fontSize="small" />, 'Computes', counts)}
          component={Link}
          value="computes"
          to="?tab=computes"
          replace
        />
        <Tab
          label={tabLabel(<PeripheralsIcon fontSize="small"/>, 'Peripherals', counts)}
          component={Link}
          value="peripherals"
          to="?tab=peripherals"
          replace
        />
        <ConditionalTab
          show={lorawan}
          label={tabLabel(<CellTowerIcon />, 'LoRaWAN Devices', counts)}
          component={Link}
          value="lorawandevices"
          to="?tab=lorawandevices"
          replace
        />
        <ConditionalTab
          show={admin}
          label={tabLabel(<HealthIcon fontSize="small" />, 'Health')}
          component={Link}
          value="health"
          to="?tab=health"
          replace
        />
      </Tabs>
    </Root>
  )
}

const Root = styled.div`

`
