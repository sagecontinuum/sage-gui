// todo(nc): use labels for input labels

import styled from 'styled-components'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import FormControlLabel from '@mui/material/FormControlLabel'

import Checkbox from '/components/input/Checkbox'
import DateInput from '/components/input/DateInput'

import { Options } from './JobStatus'


type Props = {
  opts: Options
  condensed?: boolean
  onChange: (evt: Event, name: string) => void
  onDateChange?: (val: Date) => void
}

export default function JobOptions(props: Props) {
  const {opts, condensed, onChange, onDateChange} = props

  return (
    <Root className="flex items-center">
      {/* onDateChange &&
        <div>
          <h5 className="subtitle no-margin muted">Start Date</h5>
          <DateInput
            value={opts.start}
            onChange={(val) => onDateChange(val)}
          />
        </div>
      */}

      <div className="checkboxes">
        <FormControlLabel
          control={
            <Checkbox
              checked={opts.showErrors}
              onChange={(evt) => onChange(evt, 'versions')}
            />
          }
          label="errors"
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
