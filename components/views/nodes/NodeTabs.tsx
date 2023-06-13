import styled from 'styled-components'
import { Outlet, useLocation, Link } from 'react-router-dom'

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


type Props = {
  includeSensors?: boolean
}

export default function NodeTabs(props: Props) {
  const {includeSensors = true} = props

  const loc = useLocation()
  const path = loc.search

  return (
    <Root>
      <Tabs
        value={path}
        aria-label="node tabs by node phase"
      >
        <Tab
          label={label(<CheckIcon />, 'Deployed')}
          component={Link}
          value={'?phase=deployed'}
          to={'?phase=deployed'}
          replace
        />
        <Tab
          label={label(<PendingIcon />, 'Pending Deploy')}
          component={Link}
          value={'?phase=pending'}
          to={'?phase=pending'}
          replace
        />
        <Tab
          label={label(<ConstructionIcon />, 'Maintenance')}
          component={Link}
          value={'?phase=maintenance'}
          to={'?phase=maintenance'}
          replace
        />
        <Tab
          label={label(<WarehouseIcon />, 'Standby')}
          component={Link}
          value={'?phase=standby'}
          to={'?phase=standby'}
        />
        <Tab
          label={label(<CloudOffIcon />, 'Retired')}
          component={Link}
          value={'?phase=retired'}
          to={'?phase=retired'}
          replace
        />
        <Tab
          label={label(<ShowAllIcon />, 'Show all')}
          component={Link}
          value={''}
          to={'?'}
          replace
        />
        {includeSensors &&
          <>
            <Divider
              key="divider"
              orientation="vertical"
              style={{ height: 30, alignSelf: 'center' }}
            />
            <Tab
              label={label(<SensorIcon />, 'Sensors')}
              component={Link}
              value={'/sensors'}
              to={'/sensors'}
              replace
            />
          </>
        }
      </Tabs>

      <Outlet />
    </Root>
  )
}

const Root = styled.div`
  margin: 0 10px 10px 10px;
`
