import { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import {
  ToggleButtonGroup, ToggleButton, Button,
  CircularProgress, Tooltip
} from '@mui/material'

import {
  RefreshRounded,
  StopCircle,
} from '@mui/icons-material'

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
  showAll?: boolean
  showViewType?: boolean   // curently unused
  onChange: (name: string, val?: string | boolean) => void
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
    showAll,
    // showViewType, // curently unused
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

        <div>
          {!condensed &&
            <h5 className="subtitle no-margin muted">Color type</h5>
          }
          {density &&
            <ToggleButtonGroup
              value={opts.colorType}
              onChange={(_evt, val) => onChange('colorType', val)}
              aria-label="type of coloring: number of records (density) or availability"
              exclusive
            >
              <ToggleButton value="density" aria-label="density">
                density
              </ToggleButton>
              <ToggleButton value="availability" aria-label="availability">
                availability
              </ToggleButton>
            </ToggleButtonGroup>
          }
        </div>

        {aggregation &&
          <div>
            {!condensed &&
              <h5 className="subtitle no-margin muted">Aggregation</h5>
            }
            <ToggleButtonGroup
              value={opts.time}
              onChange={(_evt, val) => onChange('time', val)}
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

      </div>


      <div className="flex">
        {!hideQuickRanges &&
          <div>
            <ToggleButtonGroup
              value={opts.window}
              onChange={(_evt, val) => onChange('window', val)}
              aria-label="change last x days"
              exclusive
            >
              {showAll &&
                <ToggleButton value="showAll" aria-label="show all, daily by default">
                  <InfIcon>-∞</InfIcon> {opts.time == 'hourly' && opts.window != 'showAll' ? ` (daily)` : ''}
                </ToggleButton>
              }
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


        <div className="flex">
          {/* todo: Should we consider tables?  showViewType &&
            <div>
              <ToggleButtonGroup
                value={opts.viewType}
                onChange={(_evt, val) => onChange('viewType', val)}
                aria-label="view type, timeline or table"
                exclusive
              >
                <ToggleButton value="timeline" aria-label="show timeline">
                  <ViewTimelineOutlined/>
                </ToggleButton>
                <ToggleButton value="table" aria-label="show table">
                  <ListAltOutlined />
                </ToggleButton>
              </ToggleButtonGroup>
            </div>
           */ }
        </div>

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
                    <StopCircle color="action" />
                  </> :
                  (pendingRange ?
                    'Go' :
                    <RefreshRounded color="action" sx={pendingRange && {color: '#f2f2f2'}} />
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

const InfIcon = styled.div`
  font-size: 1.2em;
`



