import { useEffect, useState, useReducer } from 'react'
import styled from 'styled-components'
import { Card } from '/components/layout/Layout'

import TimelineChart from '/components/viz/Timeline'
import TimelineSkeleton from '/components/viz/TimelineSkeleton'

import * as BK from '/components/apis/beekeeper'

import { addDays, addHours, endOfHour, subDays, subYears } from 'date-fns'

import config from '/config'
const registry = config.dockerRegistry

// todo(nc): promote/refactor into component lib
import DataOptions from '/components/input/DataOptions'
import { fetchRollup, parseData } from '/apps/sage/data/rollupUtils'
import { dataReducer, initDataState } from '/apps/sage/data/dataReducer'
import { type Options, colorDensity, stdColor } from '/apps/sage/data/Data'

import ErrorMsg from '/apps/sage/ErrorMsg'
import { vsnLinkNameOnly } from '/components/views/nodes/nodeFormatters'

const TIMELINE_LABEL_WIDTH = 40
const TAIL_DAYS = '-7d'

// todo(nc): generalize a la data/query browser handling of times
const getStartTime = (str) => {
  if (str.includes('d'))
    return subDays(new Date(), str.replace(/-|d/g, ''))
  else if (str.includes('y'))
    return subYears(new Date(), str.replace(/-|y/g, ''))  
  else 
    throw new Error(`getStartTime: relative start time '%{string}' not supported.`)
}

const getRangeTitle = (str) => {
  if (str.includes('d'))
    return `Last ${str.replace(/-|d/g, '')} days of data`
  else if (str.includes('y'))
    return `Last ${str.replace(/-|y/g, '')} year of data`
}


type Props = {
  plugin: string
}

export default function AppData(props: Props) {
  const {plugin} = props

  const [nodeMetas, setNodeMetas] = useState<BK.NodeMeta[]>()

  const [{data, rawData, byApp, error}, dispatch] = useReducer(
    dataReducer,
    initDataState,
  )

  const [loadingTL, setLoadingTL] = useState(false)

  const [opts, setOpts] = useState<Options>({
    display: 'nodes',
    density: true,
    versions: false,
    time: 'hourly',
    start: getStartTime(TAIL_DAYS),
    window: TAIL_DAYS
  })

  // note: endtime is not currently an option
  const [end] = useState<Date>(endOfHour(new Date()))


  useEffect(() => {
    BK.getNodeMeta()
      .then(data => {
        setNodeMetas(Object.values(data))
      }).catch(error => dispatch({type: 'ERROR', error}))
  }, [])


  useEffect(() => {
    if (!nodeMetas) return

    setLoadingTL(true)
    fetchRollup({...opts, plugin: `${registry}/${plugin}.*`})
      .then(data => dispatch({type: 'INIT_DATA', data, nodeMetas}))
      .catch(error => dispatch({type: 'ERROR', error}))
      .finally(() => setLoadingTL(false))
  }, [plugin, nodeMetas, opts])


  const handleOptionChange = (name, val) => {
    if (name == 'time') {
      const data = parseData({data: rawData, time: val})
      dispatch({type: 'SET_DATA', data})
      setOpts(prev => ({...prev, [name]: val}))
    } else if (name == 'density') {
      setOpts(prev => ({...prev, [name]: val}))
    } else if (name == 'window') {
      setOpts(prev => ({
        ...prev,
        ...(val && {window: val, start: getStartTime(val)})
      }))
    } else {
      throw `unhandled option state change name=${name}`
    }
  }


  const hasData = (data) =>
    Object.keys(data || {}).length > 0

  return (
    <Root className="flex column gap">
      {/* <CardViewStyle /> */}
      <Card>
        <div className="flex gap">
          <h2 className="no-margin">{getRangeTitle(opts.window)}</h2>
          <DataOptions onChange={handleOptionChange} opts={opts} condensed density aggregation />
        </div>
      </Card>

      <Card>
        {loadingTL && !error &&
          <TimelineSkeleton />
        }

        {data != null && !hasData(data) &&
          <span>No recent data available for this period</span>
        }

        {!loadingTL && byApp &&
          Object.keys(byApp)
            .map(name => {
              const timelineData = byApp[name]
              return (
                <TimelineContainer key={name}>
                  <h3 className="timeline-title">
                    {name.slice(name.lastIndexOf('/') + 1)}
                  </h3>
                  <TimelineChart
                    data={timelineData}
                    cellUnit={opts.time == 'daily' ? 'day' : 'hour'}
                    colorCell={opts.density ? colorDensity : stdColor}
                    startTime={opts.start}
                    endTime={end}
                    tooltip={(item) =>`
                      <div style="margin-bottom: 5px;">
                        ${new Date(item.timestamp).toDateString()} ` +
                        `${new Date(item.timestamp).toLocaleTimeString(
                          [], {timeStyle: 'short'})
                        } (${opts.time})
                      </div>
                      ${item.meta.plugin}<br>
                      ${item.value.toLocaleString()} records`
                    }
                    yFormat={vsn => vsnLinkNameOnly(vsn)}
                    onCellClick={(data) => {
                      const {timestamp, meta} = data
                      const {vsn, plugin} = meta
                      const date = new Date(timestamp)
                      const end = (opts.time == 'daily' ? addDays(date, 1) : addHours(date, 1)).toISOString()
                      window.open(
                        `${window.location.origin}/query-browser` +
                        `?nodes=${vsn}&apps=${plugin}&start=${timestamp}&end=${end}`, '_blank'
                      )
                    }}
                    labelWidth={TIMELINE_LABEL_WIDTH}
                  />
                </TimelineContainer>
              )
            })
        }

        {error &&
          <ErrorMsg>{error.message}</ErrorMsg>
        }
      </Card>
    </Root>
  )
}

const Root = styled.div`
  .timeline-title {
    float: left;
    margin: 0;
  }

  /* todo(nc): hide 'daily' until parser is fixed */
  [value=daily] { display: none; }
  [value=hourly] { border-radius: 4px !important; }
`

const TimelineContainer = styled.div`
  margin-bottom: 50px
`
