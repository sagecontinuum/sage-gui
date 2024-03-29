import styled from 'styled-components'

import { ToggleButtonGroup, ToggleButton } from '@mui/material'

import QueuedIcon from '@mui/icons-material/List'
import InProgressIcon from '@mui/icons-material/PlayCircleOutlineRounded'
import CompletedIcon from '@mui/icons-material/CheckOutlined'
import WarningIcon from '@mui/icons-material/WarningOutlined'
import SuspendedIcon from '@mui/icons-material/PauseCircleOutlineRounded'
import HideIcon from '@mui/icons-material/DeleteOutlineRounded'

import type { State } from '/components/apis/ses'
import type { Counts } from './JobStatus'


type Props = {
  counts: Counts
  state: 'Queued' | State
  onFilter: (state: 'Queued' | State) => void
}

export default function StateFilters(props: Props) {
  const {counts, state, onFilter} = props

  return (
    <Root className="flex justify-between">
      <StyledToggleButtonGroup aria-label="filter by job state" value={state}>
        <ToggleButton
          value="Queued"
          onClick={() => onFilter('Queued')}
        >
          <QueuedIcon className="queued" />
          {counts.queued} queued
        </ToggleButton>
        <ToggleButton
          value="Running"
          onClick={() => onFilter('Running')}
        >
          <InProgressIcon className="running" />
          {counts.running} running
        </ToggleButton>
        <ToggleButton
          value="Completed"
          onClick={() => onFilter('Completed')}
        >
          <CompletedIcon className="completed"/>
          {counts.completed} completed
        </ToggleButton>
        <ToggleButton
          value="Failed"
          onClick={() => onFilter('Failed')}
        >
          <WarningIcon className="failed"/>
          {counts.failed} failed
        </ToggleButton>
      </StyledToggleButtonGroup>

      <StyledToggleButtonGroup aria-label="filter by job state" value={state}>
        <ToggleButton
          value="Suspended"
          onClick={() => onFilter('Suspended')}
        >
          <SuspendedIcon className="muted"/>
          {counts.suspended} suspended
        </ToggleButton>
        <ToggleButton
          value="Removed"
          onClick={() => onFilter('Removed')}
        >
          <HideIcon className="muted"/>
          {counts.removed} removed
        </ToggleButton>
      </StyledToggleButtonGroup>
    </Root>
  )
}

const Root = styled.div`
`

const StyledToggleButtonGroup = styled(ToggleButtonGroup)`
  svg {
    margin-right: 5px;
  }

  .MuiToggleButtonGroup-root {
  }

  .MuiToggleButton-root {
    color: #444;
    padding-right: 20px;
    border-width: 0 1px 1px 1px;
    border-radius: 0 0 5px 5px;
  }

  & .MuiToggleButton-root.Mui-selected {
  }
`


