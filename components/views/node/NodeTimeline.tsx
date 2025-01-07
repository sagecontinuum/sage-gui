
/* eslint-disable max-len */
import { useEffect, useState, useReducer } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'

import { QueryStatsRounded, ImageSearchOutlined } from '@mui/icons-material'

import Timeline from '/components/viz/Timeline'
import TimelineSkeleton from '/components/viz/TimelineSkeleton'
import AppLabel from '/components/viz/TimelineAppLabel'
import { getRangeTitle } from '/components/utils/units'

import DataOptions from '/components/input/DataOptions'
import { fetchRollup, fetchUploadRollup, parseData } from '/apps/sage/data/rollupUtils'
import { dataReducer, initDataState } from '/apps/sage/data/dataReducer'
import { type Options, colorDensity, stdColor } from '/apps/sage/data/Data'

import { endOfHour, subDays, subYears, addHours, addDays } from 'date-fns'

import * as BK from '/components/apis/beekeeper'
import * as ECR from '/components/apis/ecr'
import { Tab, Tabs, tabLabel } from '/components/tabs/Tabs'


const TL_LABEL_WIDTH = 175 // default timeline label width
const TAIL_DAYS = '-7d'


const getStartTime = (str) =>
  str.includes('y') ?
    subYears(new Date(), str.replace(/-|y/g, '')) :
    subDays(new Date(), str.replace(/-|d/g, ''))


/* Todo: WIP -- if needed for tables
function getTableData(data, vsn) {
  const byItem = data[vsn]

  let table = []
  for (let [name, list] of Object.entries(byItem)) {
    const records = list.map( obj => ({...obj, 'taskWithCamera': `${obj.meta.task} (${obj.meta.camera})` }) )
    table = [...table, ...records]
  }

  table = groupBy(table, 'timestamp')

  return table
}
*/


type Props = {
  node: BK.Node
  admin?: boolean
}

export default function NodeTimeline(props: Props) {
  const { node } = props

  const vsn = useParams().vsn as BK.VSN

  const [params] = useSearchParams()
  const tab = params.get('timeline') || 'apps'


  // todo(nc): refactor into provider?
  const [{data, rawData}, dispatch] = useReducer(
    dataReducer,
    initDataState,
  )

  const [loadingTL, setLoadingTL] = useState(false)

  const [opts, setOpts] = useState<Options>({
    display: 'nodes',
    colorType: 'density',
    viewType: 'timeline',
    versions: false,
    time: 'hourly',
    start: getStartTime(TAIL_DAYS),
    window: TAIL_DAYS
  })

  const [showAll, setShowAll] = useState(false)

  // note: endtime is not currently an option
  const [end] = useState<Date>(endOfHour(new Date()))


  const [ecr, setECR] = useState<ECR.AppDetails[]>()

  // data timelines
  useEffect(() => {
    if (!node || tab != 'apps') return
    setLoadingTL(true)
    fetchRollup({...opts, vsn})
      .then(data => dispatch({type: 'INIT_DATA', data, nodes: [node]}))
      .catch(error => dispatch({type: 'ERROR', error}))
      .finally(() => setLoadingTL(false))
  }, [vsn, node, opts, tab])


  // data timelines
  useEffect(() => {
    if (!node || tab != 'uploads') return

    setLoadingTL(true)
    fetchUploadRollup({...opts, vsn})
      .then(data => {
        dispatch({type: 'INIT_DATA', data, nodes: [node]})
      })
      .catch(error => dispatch({type: 'ERROR', error}))
      .finally(() => setLoadingTL(false))
  }, [vsn, node, opts, tab])

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
    } else if (['colorType', 'viewType'].includes(name)) {
      setOpts(prev => ({...prev, [name]: val}))
    } else if (name == 'window') {
      if (!val) return

      const showAll = val == 'showAll'
      setShowAll(showAll)
      const start = getStartTime(showAll ? '-20y' : val)

      setOpts(prev => ({
        ...prev,
        ...(val && {window: val, start}),
        ...(showAll && {time: 'daily'})
      }))
    } else {
      throw `unhandled option state change name=${name}`
    }
  }


  return (
    <>
      <Tabs
        value={tab}
        aria-label="timeline view tabs"
      >
        <Tab
          label={tabLabel(<QueryStatsRounded fontSize="small" />, 'Published Records')}
          value="apps"
          component={Link}
          to="?timeline=apps"
          replace
        />
        <Tab
          label={tabLabel(<ImageSearchOutlined />, 'Uploaded Files')}
          value="uploads"
          component={Link}
          to="?timeline=uploads"
          replace
        />
      </Tabs>
      <br/>


      <TimelineContainer>
        <div className="timeline-title flex items-start gap">
          <h2>{getRangeTitle(opts.window)}</h2>
          <DataOptions
            onChange={handleOptionChange}
            opts={opts}
            quickRanges={['-1y', '-90d', '-30d', '-7d', '-2d']}
            density
            showAll
            condensed
            showViewType
            aggregation
          />
        </div>

        {loadingTL &&
          <div className="clearfix w-full">
            <TimelineSkeleton includeHeader={false} />
          </div>
        }

        {data && opts.viewType == 'timeline' && !!Object.keys(data).length && ecr && !loadingTL &&
          <Timeline
            data={data[vsn]}
            cellUnit={opts.time == 'daily' ? 'day' : 'hour'}
            colorCell={opts.colorType == 'density' ? colorDensity : stdColor}
            startTime={!showAll ? opts.start : null}
            endTime={end}
            tooltip={(item) => `
              <div style="margin-bottom: 5px;">
                ${new Date(item.timestamp).toDateString()} ${new Date(item.timestamp).toLocaleTimeString([], {timeStyle: 'short'})} (${opts.time})
              </div>
              ${item.meta.plugin}<br>
              ${item.value.toLocaleString()} ${tab == 'uploads' ? 'uploads' : 'records'}`
            }
            onCellClick={(data) => {
              const {timestamp, meta} = data
              const {vsn, origPluginName} = meta
              const date = new Date(timestamp)
              const end = (opts.time == 'daily' ? addDays(date, 1) : addHours(date, 1)).toISOString()

              let url
              if (tab == 'apps')
                url = `/query-browser?nodes=${vsn}&apps=${origPluginName}.*&start=${timestamp}&end=${end}`
              else if (tab == 'uploads')
                url = `/query-browser?type=images&tasks=${meta.task}&nodes=${vsn}&names=upload&start=${timestamp}&end=${end}`

              window.open(url, '_blank')
            }}
            yFormat={(label) => <AppLabel label={label} ecr={ecr} />}
            labelWidth={tab == 'uploads' ? TL_LABEL_WIDTH + 100 : TL_LABEL_WIDTH}
          />
        }

        {/* data && opts.viewType == 'table' && !!Object.keys(data).length && ecr && !loadingTL && vsn &&
          <Table
            primaryKey="taskWithCamera"
            columns={[{
              id: 'taskWithCamera',
              label: 'Task'
            }]}
            rows={getTableData(data, vsn)}
          />
        */}

        {data && !Object.keys(data).length && !loadingTL &&
          <div>
            <div className="clearfix"></div>
            <p className="muted">No data available</p>
          </div>
        }
      </TimelineContainer>
    </>
  )
}

const TimelineContainer = styled.div`
  margin: 0 16px 16px 16px;
`
