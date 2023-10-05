import { memo, useState } from 'react'
import styled from 'styled-components'
import {
  FormControlLabel, ToggleButtonGroup, ToggleButton, Button,
  CircularProgress, Tooltip
} from '@mui/material'

import RefreshIcon from '@mui/icons-material/RefreshRounded'
import StopIcon from '@mui/icons-material/StopCircle'

import Checkbox from '/components/input/Checkbox'
import DateRangePicker from '/components/input/DateRangePicker'

import { quickRanges as quickRangeLabels } from '/components/utils/units'
import { Options } from './Data'
import { useProgress } from '/components/progress/ProgressProvider'


type Props = {
  opts: Options
  condensed?: boolean
  aggregation?: boolean
  density?: boolean
  quickRanges?: string[]
  onChange: (evt: Event, name: string) => void
  onDateChange?: (val: [Date, Date]) => void
}

export default memo(function DataOptions(props: Props) {
  const {
    opts,
    condensed = false,
    aggregation = false,
    density = false,
    quickRanges = ['-1y', '-90d', '-30d', '-7d', '-2d'],
    onChange,
    onDateChange
  } = props

  const {loading} = useProgress()
  const [timeIsFocused, setTimeIsFocused] = useState<boolean>()
  const [pendingRange, setPendingRange] = useState<[Date, Date]>()
  const [queryCount, setQueryCount] = useState(0)



  const handleDatePickerFocus = (evt) => {
    const {name} = evt.target
    const isTime = ['hour12', 'minute', 'second', 'mPM'].includes(name)
    setTimeIsFocused(isTime)
  }


  const handleDatePickerChange = ([start, end]) => {
    if (timeIsFocused) {
      setPendingRange([start, end])
    } else {
      onDateChange([start, end])
    }
  }


  const handleRefresh = () => {
    if (loading) {
      // do nothing for now
      // setParams(prevQuery, {replace: true})
    } else if (pendingRange) {
      handleDateUpdate(pendingRange)
      setPendingRange(null)
    } else {
      onDateChange([start, end])
    }
  }



  return (
    <Root className="flex items-center">
      <div className="checkboxes">
        {density &&
          <FormControlLabel
            control={
              <Checkbox
                checked={opts.density}
                onChange={(evt) => onChange(evt, 'density')}
              />
            }
            label="density"
          />
        }
      </div>

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

      {aggregation &&
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
      }

      {condensed &&
        <div>
          <ToggleButtonGroup
            value={opts.window}
            onChange={(evt) => onChange(evt, 'window')}
            aria-label="change last x days"
            exclusive
          >
            {quickRanges.map(v => {
              return (
                <ToggleButton value={v} aria-label={quickRangeLabels[v]} key={v}>
                  {v}
                </ToggleButton>
              )
            })}
          </ToggleButtonGroup>
        </div>
      }

      {onDateChange &&
        <div>
          <DateRangePicker
            value={[opts.start, opts.end]}
            onChange={handleDatePickerChange}
            onFocus={handleDatePickerFocus}
          />

          <Tooltip title={
            loading ? 'Cancel' : (pendingRange ? 'Submit' : 'Refresh')}
          >
            <Button
              variant={pendingRange ? 'contained' : 'outlined'}
              color={pendingRange ? 'success' : 'info'}
              onClick={handleRefresh}
            >
              {loading ?
                <>
                  <CircularProgress size={25}/>
                  <StopIcon color="action" />
                </> :
                (pendingRange ?
                  'Go' :
                  <RefreshIcon color="action" sx={pendingRange && {color: '#f2f2f2'}} />
                )
              }
            </Button>
          </Tooltip>
        </div>
      }
    </Root>
  )
}, (prev, next) => prev.opts == next.opts)


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
