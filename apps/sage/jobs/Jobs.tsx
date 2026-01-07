import { styled } from '@mui/material'
import { Outlet } from 'react-router-dom'

import { Public, ScheduleRounded, AddCircleOutlineRounded } from '@mui/icons-material'

import Sidebar, { type NavItem } from '/apps/sage/ecr/Sidebar'
import Auth from '/components/auth/auth'

const getNavItems = (): NavItem[] => {
  const items: NavItem[] = [
    {
      to: 'all-jobs',
      icon: <Public />,
      label: 'All Jobs'
    },
    {
      to: 'my-jobs',
      icon: <ScheduleRounded />,
      label: 'My Jobs'
    }
  ]

  if (Auth.isSignedIn) {
    items.push(
      { divider: true },
      {
        to: '/jobs/create-job',
        icon: <AddCircleOutlineRounded />,
        label: 'Create Job'
      }
    )
  }

  return items
}

export default function Jobs() {
  return (
    <Root>
      <Sidebar items={getNavItems()} />

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
`
