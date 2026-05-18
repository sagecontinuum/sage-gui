import { styled } from '@mui/material'
import { type ReactNode } from 'react'
import {
  HubOutlined, WorkOutline, AppsRounded,
  PlaylistAddCheckRounded, GroupOutlined
} from '@mui/icons-material'

import MetricStatCard from '/components/layout/MetricStatCard'


type StatsOverviewProps = {
  uniqueNodes?: number
  totalProjects?: number
  uniqueMembers?: number
  totalApps?: number
  activeJobs?: number
  totalJobs?: number
  loading?: boolean
  lastSlot?: ReactNode
}


export default function StatsOverview({
  uniqueNodes,
  totalProjects,
  uniqueMembers,
  totalApps,
  activeJobs,
  totalJobs,
  loading = false,
  lastSlot
}: StatsOverviewProps) {
  const formatValue = (value?: number) => (loading || value === undefined ? '...' : value)
  const isLoaded = (value?: number) => !loading && value !== undefined
  const jobsLoaded = isLoaded(activeJobs) && isLoaded(totalJobs)
  const hasActiveJobs = jobsLoaded && (activeJobs ?? 0) > 0

  return (
    <StatsContainer>
      <StatsGrid>
        <MetricStatCard
          icon={<HubOutlined />}
          value={formatValue(uniqueNodes)}
          label={`My Node${isLoaded(uniqueNodes) && uniqueNodes !== 1 ? 's' : ''}`}
          to="/my-nodes"
        />

        <MetricStatCard
          icon={<WorkOutline />}
          value={formatValue(totalProjects)}
          label={`Project${isLoaded(totalProjects) && totalProjects !== 1 ? 's' : ''}`}
          to="/my-projects"
        />

        <MetricStatCard
          icon={<GroupOutlined />}
          value={formatValue(uniqueMembers)}
          label={`Team Member${isLoaded(uniqueMembers) && uniqueMembers !== 1 ? 's' : ''}`}
          to="/my-projects"
        />

        <MetricStatCard
          icon={<AppsRounded />}
          value={formatValue(totalApps)}
          label={`App${isLoaded(totalApps) && totalApps !== 1 ? 's' : ''}`}
          to="/apps/my-apps"
        />

        <MetricStatCard
          icon={<PlaylistAddCheckRounded />}
          value={
            loading || !jobsLoaded
              ? '...'
              : (hasActiveJobs
                ? <ActiveValue>{activeJobs}</ActiveValue>
                : totalJobs)
          }
          label={
            loading || !jobsLoaded
              ? 'Active Jobs'
              : (hasActiveJobs
                ? `Active Job${activeJobs !== 1 ? 's' : ''}`
                : 'Recent Jobs')
          }
          to="/jobs/my-jobs"
        />

        {lastSlot &&
          <LastSlotCard>
            {lastSlot}
          </LastSlotCard>
        }
      </StatsGrid>
    </StatsContainer>
  )
}


const StatsContainer = styled('div')`
  /* Stats layout */
`

const StatsGrid = styled('div')`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  flex: 1;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`

const ActiveValue = styled('span')`
  color: ${({ theme }) => theme.palette.success.main};
`

const LastSlotCard = styled('div')`

`
