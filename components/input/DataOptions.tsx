import { memo, useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import {
  FormControlLabel, ToggleButtonGroup, ToggleButton, Button,
  CircularProgress, Tooltip
} from '@mui/material'

import RefreshIcon from '@mui/icons-material/RefreshRounded'
import StopIcon from '@mui/icons-material/StopCircle'

import Checkbox from '/components/input/Checkbox'
import RangePicker from '/components/input/DatetimeRangePicker'

import { quickRanges as quickRangeLabels } from '/components/utils/units'
import { useProgress } from '/components/progress/ProgressProvider'
import { Options } from '../../apps/sage/data/Data'
import TimeOpts from './StyledTimeOpts'


type Props = {
  opts: Options
  groupByToggle?: boolean
  condensed?: boolean
  aggregation?: boolean
  density?: boolean
  hideQuickRanges?: boolean
  quickRanges?: string[]
  onChange: (name: string, val?: string) => void
  onDateChange?: (val: [Date, Date]) => void
}

export default function DataOptions(props: Props) {
  const {
    opts,
    groupByToggle = false,
    condensed = false,
    aggregation = false,
    density = false,
    hideQuickRanges = false,
    quickRanges = ['-1y', '-90d', '-30d', '-7d', '-2d'],
    onChange,
    onDateChange
  } = props

  const {loading} = useProgress()
  const [calClosed, setCalClosed] = useState<boolean>(true)
  const [pendingRange, setPendingRange] = useState<[Date, Date]>()


  const update = useCallback(() => {
    onDateChange(pendingRange)
    setPendingRange(null)
    onChange('window', null)
  }, [pendingRange, onDateChange, onChange])


  // regular submit
  const handleSubmit = useCallback(() => {
    if (pendingRange) {
      update()
    } else {
      // reset
      onChange('time', 'hourly')
      onChange('window', '-7d')
    }
  }, [pendingRange, update, onChange])


  // a workaround for updating ranges whenever there
  // was a change AND when the cal is closed (or when 'enter' is pressed)
  useEffect(() => {
    if (pendingRange && calClosed) {
      update()
    }
  }, [pendingRange, calClosed, update])


  useEffect(() => {
    const onKeyDown = (e) => e.key === 'Enter' && handleSubmit()
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [handleSubmit])


  const handleDatePickerChange = ([start, end]) => {
    setPendingRange([start, end])
  }


  return (
    <Root className="flex items-center">
      <div className="flex flex-grow gap">
        {groupByToggle &&
          <div>
            {!condensed &&
              <h5 className="subtitle no-margin muted">Group by</h5>
            }
            <ToggleButtonGroup
              value={opts.display}
              onChange={(evt, val) => onChange(val)}
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
            {!condensed &&
              <h5 className="subtitle no-margin muted">Aggregation</h5>
            }
            <ToggleButtonGroup
              value={opts.time}
              onChange={(evt) => onChange('time', evt.target.value)}
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


        <div className="flex">
          {density &&
            <FormControlLabel
              control={
                <Checkbox
                  checked={opts.density}
                  onChange={(evt) => onChange('density', evt.target.checked)}
                />
              }
              label="density"
            />
          }
        </div>
      </div>


      <div className="flex">
        {!hideQuickRanges &&
          <div>
            <ToggleButtonGroup
              value={opts.window}
              onChange={(evt) => onChange('window', evt.target.value)}
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
          <TimeOpts >
            <RangePicker
              value={pendingRange || [opts.start, opts.end]}
              onChange={handleDatePickerChange}
              onCalendarClose={() => setCalClosed(true)}
              onCalendarOpen={() => setCalClosed(false)}
              maxDetail="hour"
            />

            <Tooltip title={
              loading ? 'Cancel' : (pendingRange ? 'Submit' : 'Refresh')}
            >
              <Button
                variant={pendingRange ? 'contained' : 'outlined'}
                color={pendingRange ? 'success' : 'info'}
                type="submit"
                onClick={handleSubmit}
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
          </TimeOpts>
        }
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
`



