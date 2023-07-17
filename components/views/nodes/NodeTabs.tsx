import styled from 'styled-components'
import { Outlet, useLocation, useSearchParams, Link } from 'react-router-dom'

import { Tabs, Tab } from '/components/tabs/Tabs'
import { TabProps } from '@mui/material'

import HubIcon from '@mui/icons-material/HubOutlined'
import SensorIcon from '@mui/icons-material/SensorsRounded'



const label = (
  icon: JSX.Element,
  label: 'Nodes' | 'Sensors'
) =>
  <div className="flex items-center">
    {icon}&nbsp;{label}
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

  const path = useLocation().pathname
  const [params] = useSearchParams()

  const defaultPath = path === '/sensors' ? '/nodes' : path
  const tab = params.get('phase') || path

  return (
    <Root>
      <Tabs
        value={tab}
        aria-label="node tabs by node phase"
      >
        <Tab
          label={label(<HubIcon />, 'Nodes')}
          component={Link}
          value={defaultPath}
          to={defaultPath}
          replace
        />

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
