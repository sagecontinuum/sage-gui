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
    <div className="flex justify-between">
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
    </div>
  )
}

const StyledToggleButtonGroup = styled(ToggleButtonGroup)`
  svg {
    margin-right: 5px;
  }

  .MuiToggleButtonGroup-root {
  }

  .MuiToggleButton-root {
    color: #444;
    border: none;
    margin-right: 20px;
    border-top: 2px solid #fff;
    border-radius: 0;
  }

  & .MuiToggleButton-root.Mui-selected {
    background-color: #fff;
    border-top: 2px solid #4e2a84;
  }
`


