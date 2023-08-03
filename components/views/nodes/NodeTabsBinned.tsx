import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Outlet, useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom'

import { Tabs, Tab } from '/components/tabs/Tabs'
import { TabProps } from '@mui/material'
import Divider from '@mui/material/Divider'

import CheckIcon from '@mui/icons-material/Check'
import SupportIcon from '@mui/icons-material/SupportAgentRounded'
import PendingIcon from '@mui/icons-material/PendingActionsRounded'
import ConstructionIcon from '@mui/icons-material/HandymanOutlined'
import WarehouseIcon from '@mui/icons-material/WarehouseOutlined'
import CloudOffIcon from '@mui/icons-material/CloudOffRounded'
import ShowAllIcon from '@mui/icons-material/SelectAll'
import SensorIcon from '@mui/icons-material/SensorsRounded'

import { sum, countBy } from 'lodash'

import * as BK from '/components/apis/beekeeper'

import settings from '/components/settings'
import { filterData, type FilterState, initialState } from '../statusDataUtils'

import { parseQueryStr } from '/components/utils/queryString'


type Label = BK.Phase | 'Show All' | 'Sensors'

type PhaseCounts = {
  [phase in BK.Phase]: number
}

type Counts =  PhaseCounts & {'Show All': number}


function getPhaseCounts(data: BK.NodeMeta[], filterState: FilterState) : PhaseCounts {
  data = filterData(data, filterState) as BK.NodeMeta[]
  return countBy(data, 'node_phase_v3') as PhaseCounts
}


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
  includeSensors?: boolean // weather or not to include the sensors tab
  isAdmin?: boolean        // show totals for all projects in admin view
}

export default function NodeTabs(props: Props) {
  const {includeSensors = true, isAdmin = false} = props

  const navigate = useNavigate()
  const path = useLocation().pathname
  const defaultPath = path === '/sensors' ? '/nodes' : path

  const [params] = useSearchParams()
  const tab = params.get('phase') || 'all'

  const [production, setProduction] = useState<BK.NodeMeta[]>()
  const [counts, setCounts] = useState<Counts>()


  useEffect(() => {
    BK.getProduction()
      .then(data => {
        setProduction(data)
      })
      .catch(() => { /* do nothing */ })
  }, [])


  // update counts whenever params change, if not a project view
  useEffect(() => {
    if (!production) return

    updateCounts(production)
  }, [params, production])


  const updateCounts = (data: BK.NodeMeta[]) => {
    if (settings.project && !isAdmin) {
      data = data.filter(obj => obj.project == settings.project)
    }

    const filterState = parseQueryStr(params, {initialState, exclude: ['query', 'phase']})
    const counts = getPhaseCounts(data, filterState)

    setCounts({
      ...counts,
      'Show All': sum(Object.values(counts))
    })
  }

  const onChange = (evt, tab: BK.PhaseTabs & '/sensors') => {
    if (tab == '/sensors')
      return

    if (tab == 'all') params.delete('phase')
    else params.set('phase', tab)

    navigate(`${defaultPath}?${params.toString()}`, {replace: true})
  }

  return (
    <Root>
      <Tabs
        value={path == '/sensors' ? path : tab}
        aria-label="node tabs by node phase"
        onChange={onChange}
      >
        <Tab
          label={label(<CheckIcon />, 'Deployed', counts)}
          value="deployed"
        />
        <Tab
          label={label(<SupportIcon />, 'Awaiting Deployment', counts)}
          value="awaiting"
        />
        <Tab
          label={label(<PendingIcon />, 'Shipment Pending', counts)}
          value="pending"
        />
        <Tab
          label={label(<ConstructionIcon />, 'Maintenance', counts)}
          value="maintenance"
        />
        <Tab
          label={label(<WarehouseIcon />, 'Standby', counts)}
          value="standby"
        />
        <Tab
          label={label(<CloudOffIcon />, 'Retired', counts)}
          value="retired"
        />
        <Tab
          label={label(<ShowAllIcon />, 'Show All', counts)}
          value="all"
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
