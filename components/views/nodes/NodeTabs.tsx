import { Badge, styled } from '@mui/material'
import type { Theme } from '@mui/material/styles'
import { Outlet, useLocation } from 'react-router-dom'

import {
  AccountCircleOutlined, GroupOutlined,
  WorkOutline, SelectAll, SensorsRounded,
  FiberNewOutlined, DashboardOutlined,
  CheckCircleOutline, ListAlt, SettingsOutlined
} from '@mui/icons-material'

import HardDriveIcon from '/assets/hard-drive.svg'
import Auth from '/components/auth/auth'
import CollapsibleNavSidebar, { NavItem } from '/components/layout/CollapsibleNavSidebar'

const userBadgeSx = {
  '& .MuiBadge-badge': {
    backgroundColor: (theme: Theme) => theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
    color: 'inherit',
    right: 6,
    top: 4,
    borderRadius: '50%',
    minWidth: 'auto',
    width: '0.9em',
    height: '0.9em',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
}

const getNavItems = (includeSensors: boolean, search: string) => {
  let items: NavItem[] = [
    {
      to: `all-nodes`,
      icon: <SelectAll />,
      label: 'All Nodes',
      expandable: true,
      expanded: false
    },
    {
      to: `all-nodes/sgt`,
      icon:
        <Badge
          badgeContent={<FiberNewOutlined style={{fontSize: '1.5em'}} />}
          anchorOrigin={{vertical: 'top', horizontal: 'right'}}
          overlap="circular"
          sx={userBadgeSx}
        >
          <HardDriveIcon />
        </Badge>,
      label: <>SGT</>,
      submenuLabel: 'Sage Grande',
      submenuMetaLabel: 'SGT',
      minimizedLabel: 'SGT',
      indent: true,
      parentId: 'all-nodes'
    },
    {
      to: `all-nodes/sage`,
      icon: <HardDriveIcon />,
      label: <>Sage</>,
      submenuLabel: 'Sage',
      submenuMetaLabel: 'legacy',
      indent: true,
      parentId: 'all-nodes'
    },
    // ------------------------------
    {
      to: `nodes`,
      icon:
        <Badge
          badgeContent={<CheckCircleOutline style={{fontSize: '1.2em'}} />}
          anchorOrigin={{vertical: 'top', horizontal: 'left'}}
          overlap="circular"
          sx={userBadgeSx}
        >
          <ListAlt />
        </Badge>,
      label: 'Status',
      submenuLabel: 'All Status',
      expandable: true,
      expanded: true
    },
    {
      to: `nodes/project/sgt`,
      icon:
        <Badge
          badgeContent={<CheckCircleOutline style={{fontSize: '1.2em'}} />}
          anchorOrigin={{vertical: 'top', horizontal: 'left'}}
          overlap="circular"
          sx={userBadgeSx}
        >
          <HardDriveIcon />
        </Badge>,
      label: <>SGT</>,
      submenuLabel: 'Sage Grande',
      submenuMetaLabel: 'SGT',
      minimizedLabel: 'SGT',
      indent: true,
      parentId: 'nodes'
    },
    {
      to: `nodes/project/sage`,
      icon:
        <Badge
          badgeContent={<CheckCircleOutline style={{fontSize: '1.2em'}} />}
          anchorOrigin={{vertical: 'top', horizontal: 'left'}}
          overlap="circular"
          sx={userBadgeSx}
        >
          <HardDriveIcon />
        </Badge>,
      label: <>Sage</>,
      submenuLabel: 'Sage',
      submenuMetaLabel: 'legacy',
      indent: true,
      parentId: 'nodes'
    }
  ]

  if (includeSensors) {
    items = [...items,
      {
        to: `sensors${search}`,
        icon: <SensorsRounded />,
        label: 'Sensors',
        tooltip: 'All Sensors'
      }
    ]
  }


  items = [...items,
    'divider',
    {
      to: 'my-dash',
      icon: <DashboardOutlined />,
      label: 'Dash',
      tooltip: 'My Dashboard'
    },
    {
      to: 'my-nodes?show_all=true',
      icon: <AccountCircleOutlined />,
      label: 'My Nodes',
      submenuLabel: 'Nodes',
      expandable: true,
      expanded: false
    },
    {
      to: 'my-nodes/project/sgt?show_all=true',
      icon: (
        <Badge
          badgeContent={<AccountCircleOutlined style={{fontSize: '1.4em'}} />}
          anchorOrigin={{vertical: 'top', horizontal: 'right'}}
          overlap="circular"
          sx={userBadgeSx}
        >
          <HardDriveIcon />
        </Badge>
      ),
      label: <>SGT</>,
      submenuLabel: 'Sage Grande',
      submenuMetaLabel: 'SGT',
      tooltip: 'My SGT Nodes',
      minimizedLabel: 'My SGT Nodes',
      indent: true,
      parentId: 'my-nodes',
    },
    {
      to: 'my-nodes/project/sage?show_all=true',
      icon: (
        <Badge
          badgeContent={<AccountCircleOutlined style={{fontSize: '1.4em'}} />}
          anchorOrigin={{vertical: 'top', horizontal: 'right'}}
          overlap="circular"
          sx={userBadgeSx}
        >
          <HardDriveIcon />
        </Badge>
      ),
      label: <>Sage</>,
      submenuLabel: 'Sage',
      submenuMetaLabel: 'legacy',
      tooltip: 'My Sage Nodes',
      minimizedLabel: 'My Sage Nodes',
      indent: true,
      parentId: 'my-nodes',
    },
  ]

  if (Auth.isSignedIn) {
    items = [...items,
      {
        to: 'my-projects',
        icon: <WorkOutline />,
        label: 'Projects',
        tooltip: 'My Projects'
      },
      {
        to: 'my-teams',
        icon: <GroupOutlined />,
        label: 'Members',
        tooltip: 'My Teams'
      }
    ]
  }

  items = [...items,
    {
      to: 'account/access',
      icon: <SettingsOutlined />,
      label: 'Settings',
      tooltip: 'Settings',
      pinBottom: true
    }
  ]

  return items
}


type Props = {
  includeSensors?: boolean // weather or not to include the sensors tab
  isAdmin?: boolean        // show totals for all projects in admin view
}

export default function NodeTabs(props: Props) {
  const {includeSensors = true} = props
  const {search} = useLocation()

  const navItems = getNavItems(includeSensors, search)

  return (
    <Root>
      <CollapsibleNavSidebar
        navItems={navItems}
        storageKey="nodes.sidebar.state"
        defaultMinimized={true}
        forceMinimized={true}
        collapsible={false}
        submenuMode="popover"
        submenuTrigger="hover-or-click"
        itemIdGenerator={(item) => {
          if (item === 'divider') return ''
          return item.to?.split('?')[0] || ''
        }}
      />
      <Main>
        <Outlet />
      </Main>
    </Root>
  )
}

const Root = styled('div')`
  display: flex;
  height: 100%;
`

const Main = styled('div')`
  padding: 0 20px;
  flex-grow: 1;
  overflow-y: auto;
  margin-left: 75px;
`