import { useEffect, useState, useReducer } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Card } from '/components/layout/Layout'

import TimelineChart from '/components/viz/Timeline'
import TimelineSkeleton from '/components/viz/TimelineSkeleton'

import * as BK from '/components/apis/beekeeper'

import { endOfHour, subDays } from 'date-fns'

import config from '/config'
const registry = config.dockerRegistry

// todo(nc): promote/refactor into component lib
import DataOptions from '/apps/sage/data/DataOptions'
import { fetchRollup, parseData } from '/apps/sage/data/rollupUtils'
import { dataReducer, initDataState } from '/apps/sage/data/dataReducer'
import { type Options, colorDensity, stdColor } from '/apps/sage/data/Data'

import ErrorMsg from '/apps/sage/ErrorMsg'

const TIMELINE_LABEL_WIDTH = 40
const TAIL_DAYS = '-7d'


const getStartTime = (str) =>
  subDays(new Date(), str.replace(/-|d/g, ''))


type Props = {
  plugin: string
}

export default function AppData(props: Props) {
  const {plugin} = props

  const [manifests, setManifests] = useState<BK.Manifest[]>()

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
  const [end, setEnd] = useState<Date>(endOfHour(new Date()))


  useEffect(() => {
    BK.getProdSheet({by: 'vsn'})
      .then(data => {
        setManifests(Object.values(data))
      }).catch(error => dispatch({type: 'ERROR', error}))
  }, [])


  useEffect(() => {
    if (!manifests) return

    setLoadingTL(true)
    fetchRollup({...opts, plugin: `${registry}/${plugin}.*`})
      .then(data => dispatch({type: 'INIT_DATA', data, manifests}))
      .catch(error => dispatch({type: 'ERROR', error}))
      .finally(() => setLoadingTL(false))
  }, [plugin, manifests, opts])


  const handleOptionChange = (evt, name) => {
    if (name == 'time') {
      const time = evt.target.value
      const data = parseData({data: rawData, time})
      dispatch({type: 'SET_DATA', data})
      setOpts(prev => ({...prev, [name]: time}))
    } else if (name == 'density') {
      setOpts(prev => ({...prev, [name]: evt.target.checked}))
    } else if (name == 'window') {
      const window = evt.target.value
      setOpts(prev => ({
        ...prev,
        start: getStartTime(window),
        window
      }))
    } else {
      throw `unhandled option state change name=${name}`
    }
  }


  const getNodeID = (vsn) => {
    return manifests.find(o => o.vsn == vsn).node_id
  }

  const hasData = (data) =>
    Object.keys(data || {}).length > 0

  return (
    <Root className="flex column gap">
      {/* <CardViewStyle /> */}
      <Card>
        <div className="flex gap">
          <h2 className="no-margin">Last {opts.window.replace(/-|d/g, '')} days of data</h2>
          <DataOptions onChange={handleOptionChange} opts={opts} condensed />
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
                    yFormat={vsn =>
                      <Link to={`/node/${getNodeID(vsn)}`} target="_blank">{vsn}</Link>}
                    onCellClick={(data) => {
                      const {timestamp, meta} = data
                      const {vsn, plugin} = meta
                      const win = opts.time == 'daily' ? 'd' : 'h'
                      window.open(
                        `${window.location.origin}/query-browser` +
                        `?nodes=${vsn}&apps=${plugin}&start=${timestamp}&window=${win}`, '_blank'
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
