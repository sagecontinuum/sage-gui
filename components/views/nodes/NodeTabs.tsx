import styled from 'styled-components'
import { Outlet, useLocation, useSearchParams, Link } from 'react-router-dom'

import { Tabs, Tab } from '/components/tabs/Tabs'

import CheckIcon from '@mui/icons-material/Check'
import PendingIcon from '@mui/icons-material/PendingActionsRounded'
import ConstructionIcon from '@mui/icons-material/HandymanOutlined'
import WarehouseIcon from '@mui/icons-material/WarehouseOutlined'
import CloudOffIcon from '@mui/icons-material/CloudOffRounded'
import ShowAllIcon from '@mui/icons-material/SelectAll'
import SensorIcon from '@mui/icons-material/SensorsRounded'

import Divider from '@mui/material/Divider'


const label = (icon, label) =>
  <div className="flex items-center">
    {icon}&nbsp;{label}
  </div>


// a tab is rendered with react.clone, so we must explicity pass TabProps
const ConditionalTab = (props) =>
  props.show ? <Tab {...props} /> : <></>


type Props = {
  includeSensors?: boolean
}

export default function NodeTabs(props: Props) {
  const {includeSensors = true} = props

  const path = useLocation().pathname
  const [params] = useSearchParams()

  const tab = path == '/nodes' ? (params.get('phase') || '') : path

  return (
    <Root>
      <Tabs
        value={tab}
        aria-label="node tabs by node phase"
      >
        <Tab
          label={label(<CheckIcon />, 'Deployed')}
          component={Link}
          value={'deployed'}
          to={'/nodes?phase=deployed'}
          replace
        />
        <Tab
          label={label(<PendingIcon />, 'Pending Deploy')}
          component={Link}
          value={'pending'}
          to={'/nodes?phase=pending'}
          replace
        />
        <Tab
          label={label(<ConstructionIcon />, 'Maintenance')}
          component={Link}
          value={'maintenance'}
          to={'/nodes?phase=maintenance'}
          replace
        />
        <Tab
          label={label(<WarehouseIcon />, 'Standby')}
          component={Link}
          value={'standby'}
          to={'/nodes?phase=standby'}
        />
        <Tab
          label={label(<CloudOffIcon />, 'Retired')}
          component={Link}
          value={'retired'}
          to={'/nodes?phase=retired'}
          replace
        />
        <Tab
          label={label(<ShowAllIcon />, 'Show all')}
          component={Link}
          value={''}
          to={'/nodes'}
          replace
        />

        {includeSensors &&
          <Divider
            key="divider"
            orientation="vertical"
            style={{ height: 30, alignSelf: 'center' }}
          />
        }

        <ConditionalTab
          label={label(<SensorIcon />, 'Sensors')}
          component={Link}
          value={'/sensors'}
          to={'/sensors'}
          show={includeSensors}
        />
      </Tabs>

      <Outlet />
    </Root>
  )
}

const Root = styled.div`
  margin: 0 10px 10px 10px;
`
