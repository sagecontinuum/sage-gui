// todo(nc): use labels for input labels

import styled from 'styled-components'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import FormControlLabel from '@mui/material/FormControlLabel'

import Checkbox from '/components/input/Checkbox'
import DateInput from '/components/input/DateInput'

import { Options } from './Data'


type Props = {
  opts: Options
  condensed?: boolean
  onChange: (evt: Event, name: string) => void
  onDateChange?: (val: Date) => void
}

export default function DataOptions(props: Props) {
  const {opts, condensed, onChange, onDateChange} = props

  return (
    <Root className="flex items-center">
      {!condensed &&
        <div>
          <h5 className="subtitle no-margin muted">Group by</h5>
          <ToggleButtonGroup
            value={opts.display}
            onChange={(evt, val) => onChange(evt, val)}
            aria-label="group by"
            exclusive
          >
            <ToggleButton value="nodes" aria-label="nodes">
              Nodes
            </ToggleButton>
            <ToggleButton value="apps" aria-label="apps">
              Apps
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      }

      <div>
        <h5 className="subtitle no-margin muted">{!condensed && 'Aggregation'}</h5>
        <ToggleButtonGroup
          value={opts.time}
          onChange={(evt) => onChange(evt, 'time')}
          aria-label="change time (windows)"
          exclusive
        >
          <ToggleButton value="hourly" aria-label="hourly">
            hourly
          </ToggleButton>
          <ToggleButton value="daily" aria-label="daily">
            daily
          </ToggleButton>
        </ToggleButtonGroup>
      </div>

      {condensed &&
        <div>
          <ToggleButtonGroup
            value={opts.window}
            onChange={(evt) => onChange(evt, 'window')}
            aria-label="change last x days"
            exclusive
          >
            <ToggleButton value="-365d" aria-label="last year (365 days)">
              -1y
            </ToggleButton>
            <ToggleButton value="-90d" aria-label="last 90 days">
              -90d
            </ToggleButton>
            <ToggleButton value="-30d" aria-label="last 30 days">
              -30d
            </ToggleButton>
            <ToggleButton value="-7d" aria-label="last 7 days">
              -7d
            </ToggleButton>
            <ToggleButton value="-2d" aria-label="last 2 days">
              -2d
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      }

      {onDateChange &&
        <div>
          <h5 className="subtitle no-margin muted">Start Date</h5>
          <DateInput
            value={opts.start}
            onChange={(val) => onDateChange(val)}
          />
        </div>
      }

      <div className="checkboxes">
        {/*
        <FormControlLabel
          control={
            <Checkbox
              checked={opts.versions}
              onChange={(evt) => onChange(evt, 'versions')}
            />
          }
          label="versions"
        />
        */}
        <FormControlLabel
          control={
            <Checkbox
              checked={opts.density}
              onChange={(evt) => onChange(evt, 'density')}
            />
          }
          label="density"
        />
      </div>
    </Root>
  )
}

const Root = styled.div`
  [role=group] {
    margin-right: 10px;
  }

  .MuiToggleButtonGroup-root {
    height: 27px;
  }

  .checkboxes {
    margin: 0px 10px 0 20px;
  }
`
