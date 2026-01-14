import { styled } from '@mui/material'
import { Outlet, useLocation, Link } from 'react-router-dom'

import { Tabs, Tab } from '/components/tabs/Tabs'
import { TabProps } from '@mui/material'


import CheckIcon from '@mui/icons-material/CheckRounded'
import RuleIcon from '@mui/icons-material/RuleRounded'
import SensorIcon from '@mui/icons-material/SensorsRounded'
import ShowAllIcon from '@mui/icons-material/SelectAll'



const label = (
  icon: JSX.Element,
  label: 'Node Status' | 'All Nodes' | 'Sensors'
) =>
  <div className="flex items-center">
    {icon}&nbsp;{label}
  </div>



// a tab is rendered with react.clone, so we must explicity pass TabProps
const ConditionalTab = ({show, ...props}: TabProps & {show: boolean, component, to}) =>
  show ? <Tab {...props} /> : <></>


type Props = {
  includeSensors?: boolean // weather or not to include the sensors tab
  isAdmin?: boolean        // show totals for all projects in admin view
}

export default function NodeTabs(props: Props) {
  const {includeSensors = true} = props

  const {pathname, search} = useLocation()
  const tab = `${pathname}${search}`

  return (
    <Root>
      <Tabs
        value={tab}
        aria-label="node related tabs"
      >
        <Tab
          label={label(search.includes('show_all') ? <RuleIcon/> : <CheckIcon /> , 'Node Status')}
          component={Link}
          value={`/nodes${search}`}
          to={`/nodes${search}`}
          replace
        />

        <Tab
          label={label(<ShowAllIcon />, 'All Nodes')}
          component={Link}
          value={`/all-nodes${search}`}
          to={`/all-nodes${search}`}
          replace
        />

        <ConditionalTab
          label={label(<SensorIcon />, 'Sensors')}
          component={Link}
          value={`/sensors${search}`}
          to={`/sensors${search}`}
          show={includeSensors}
        />
      </Tabs>

      <Outlet />
    </Root>
  )
}

const Root = styled('div')`
  margin: 0 10px 10px 10px;
`
