
/* eslint-disable max-len */
import { useEffect, useState, useReducer } from 'react'
import { useParams } from 'react-router-dom'


import Timeline from '/components/viz/Timeline'
import TimelineSkeleton from '/components/viz/TimelineSkeleton'
import AppLabel from '/components/viz/TimelineAppLabel'
import { getRangeTitle } from '/components/utils/units'


import DataOptions from '/components/input/DataOptions'
import { fetchRollup, parseData } from '/apps/sage/data/rollupUtils'
import { dataReducer, initDataState } from '/apps/sage/data/dataReducer'
import { type Options, colorDensity, stdColor } from '/apps/sage/data/Data'

import { endOfHour, subDays, subYears, addHours, addDays } from 'date-fns'

import { LABEL_WIDTH as ADMIN_TL_LABEL_WIDTH } from './AdminNodeHealth'

import * as BK from '/components/apis/beekeeper'
import * as ECR from '/components/apis/ecr'


const TL_LABEL_WIDTH = 175 // default timeline label width
const TAIL_DAYS = '-7d'


const getStartTime = (str) =>
  str.includes('y') ?
    subYears(new Date(), str.replace(/-|y/g, '')) :
    subDays(new Date(), str.replace(/-|d/g, ''))


type Props = {
  node: BK.Node
  admin?: boolean
}

export default function NodeTimeline(props: Props) {
  const { node, admin } = props

  const vsn = useParams().vsn as BK.VSN


  // todo(nc): refactor into provider?
  const [{data, rawData}, dispatch] = useReducer(
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

  const [ecr, setECR] = useState<ECR.AppDetails[]>()

  // data timelines
  useEffect(() => {
    if (!node) return
    setLoadingTL(true)
    fetchRollup({...opts, vsn})
      .then(data => dispatch({type: 'INIT_DATA', data, nodes: [node]}))
      .catch(error => dispatch({type: 'ERROR', error}))
      .finally(() => setLoadingTL(false))

  }, [vsn, node, opts])


  // fetch public ECR apps to determine if apps are indeed public
  useEffect(() => {
    ECR.listApps('public')
      .then(ecr => setECR(ecr))
  }, [])


  const handleOptionChange = (name, val) => {
    if (['nodes', 'apps'].includes(name)) {
      setOpts(prev => ({...prev, display: name}))
      return
    } else  if (name == 'time') {
      const time = val
      const data = parseData({data: rawData, time})
      dispatch({type: 'SET_DATA', data})
      setOpts(prev => ({...prev, [name]: time}))
      return
    } else if (name == 'versions') {
      const versions = val
      const data = parseData({data: rawData, time: opts.time, versions})
      dispatch({type: 'SET_DATA', data})
      setOpts(prev => ({...prev, [name]: versions}))
      return
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


  return (
    <>
      <div className="timeline-title flex items-start gap">
        <h2>{getRangeTitle(opts.window)}</h2>
        <DataOptions onChange={handleOptionChange} opts={opts} condensed density aggregation />
      </div>

      {loadingTL &&
          <div className="clearfix w-full">
            <TimelineSkeleton includeHeader={false} />
          </div>
      }

      {data && !!Object.keys(data).length && ecr && !loadingTL &&
        <Timeline
          data={data[vsn]}
          cellUnit={opts.time == 'daily' ? 'day' : 'hour'}
          colorCell={opts.density ? colorDensity : stdColor}
          startTime={opts.start}
          endTime={end}
          tooltip={(item) => `
            <div style="margin-bottom: 5px;">
            ${new Date(item.timestamp).toDateString()} ${new Date(item.timestamp).toLocaleTimeString([], {timeStyle: 'short'})} (${opts.time})
            </div>
            ${item.meta.plugin}<br>
            ${item.value.toLocaleString()} records`
          }
          onCellClick={(data) => {
            const {timestamp, meta} = data
            const {vsn, origPluginName} = meta
            const date = new Date(timestamp)
            const end = (opts.time == 'daily' ? addDays(date, 1) : addHours(date, 1)).toISOString()
            window.open(`/query-browser?nodes=${vsn}&apps=${origPluginName}.*&start=${timestamp}&end=${end}`, '_blank')
          }}
          yFormat={(label) => <AppLabel label={label} ecr={ecr} />}
          labelWidth={admin ? ADMIN_TL_LABEL_WIDTH : TL_LABEL_WIDTH}
        />
      }

      {data && !Object.keys(data).length && !loadingTL &&
          <div>
            <div className="clearfix"></div>
            <p className="muted">No data available</p>
          </div>
      }
    </>
  )
}