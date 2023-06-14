import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Outlet, useLocation, useSearchParams, Link } from 'react-router-dom'

import { Tabs, Tab } from '/components/tabs/Tabs'
import { TabProps } from '@mui/material'
import Divider from '@mui/material/Divider'

import CheckIcon from '@mui/icons-material/Check'
import PendingIcon from '@mui/icons-material/PendingActionsRounded'
import ConstructionIcon from '@mui/icons-material/HandymanOutlined'
import WarehouseIcon from '@mui/icons-material/WarehouseOutlined'
import CloudOffIcon from '@mui/icons-material/CloudOffRounded'
import ShowAllIcon from '@mui/icons-material/SelectAll'
import SensorIcon from '@mui/icons-material/SensorsRounded'

import { sum } from 'lodash'

import * as BK from '/components/apis/beekeeper'

import settings from '/apps/project/settings'

type Label = BK.Phase | 'Show All' | 'Sensors'
type Counts =  BK.PhaseCounts & {'Show All': number}


const label = (
  icon: JSX.Element,
  label: Label,
  counts?: Counts
) =>
  <div className="flex items-center">
    {icon}&nbsp;{label} {
      counts !== null &&
        `(${counts ? (counts[label] || 0) : '…'})`
    }
  </div>


// a tab is rendered with react.clone, so we must explicity pass TabProps
const ConditionalTab = (props: TabProps & {show: boolean, component, to}) =>
  props.show ? <Tab {...props} /> : <></>


type Props = {
  includeSensors?: boolean
}

export default function NodeTabs(props: Props) {
  const {includeSensors = true} = props

  const path = useLocation().pathname
  const [params] = useSearchParams()

  const [counts, setCounts] = useState<Counts>()

  useEffect(() => {
    BK.getPhaseCounts(settings.project)
      .then(counts =>
        setCounts({
          ...counts,
          'Show All': sum(Object.values(counts))
        })
      )
      .catch(() => { /* do nothing */ })
  }, [])


  const tab = path == '/nodes' ? (params.get('phase') || '') : path

  return (
    <Root>
      <Tabs
        value={tab}
        aria-label="node tabs by node phase"
      >
        <Tab
          label={label(<CheckIcon />, 'Deployed', counts)}
          component={Link}
          value={'deployed'}
          to={'/nodes?phase=deployed'}
          replace
        />
        <Tab
          label={label(<PendingIcon />, 'Pending Deploy', counts)}
          component={Link}
          value={'pending'}
          to={'/nodes?phase=pending'}
          replace
        />
        <Tab
          label={label(<ConstructionIcon />, 'Maintenance', counts)}
          component={Link}
          value={'maintenance'}
          to={'/nodes?phase=maintenance'}
          replace
        />
        <Tab
          label={label(<WarehouseIcon />, 'Standby', counts)}
          component={Link}
          value={'standby'}
          to={'/nodes?phase=standby'}
        />
        <Tab
          label={label(<CloudOffIcon />, 'Retired', counts)}
          component={Link}
          value={'retired'}
          to={'/nodes?phase=retired'}
          replace
        />
        <Tab
          label={label(<ShowAllIcon />, 'Show All', counts)}
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
          label={label(<SensorIcon />, 'Sensors', null)}
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
