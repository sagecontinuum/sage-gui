import styled from 'styled-components'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '/components/input/Checkbox'

import { Options } from './Data'

type Props = {
  opts: Options
  onChange: (evt: Event, name: string) => void
}

export default function (props: Props) {
  const {opts, onChange} = props

  return (
    <div className="flex">
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

      <div>
        <h5 className="subtitle no-margin muted">Time</h5>
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

      <div className="checkboxes">
        <FormControlLabel
          control={
            <Checkbox
              checked={opts.versions}
              onChange={(evt) => onChange(evt, 'versions')}
            />
          }
          label="versions"
        />
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
    </div>
  )
}

const Root = styled.div`

`
