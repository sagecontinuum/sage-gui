import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { groupBy } from 'lodash'

import Alert from '@mui/material/Alert'

import Map from '/components/Map'
import Table from '/components/table/Table'
import JobTimeLine from './JobTimeline'
import Sidebar from '../data-commons/DataSidebar'

import SummaryBar from '../../admin/views/status/charts/SummaryBar'
import { schemeCategory10 } from 'd3-scale-chromatic'

import * as BK from '/components/apis/beekeeper'
import * as BH from '/components/apis/beehive'
import { useProgress } from '/components/progress/ProgressProvider'



type TaskEvent = {
  timestamp: string
  name: string
  value: {
    goal_id: string                     // "f50d19ca-7dee-4dee-78f5-05eb258eeecf",
    k3s_job_name: string                // "surface-water-detection-left-1645641900",
    k3s_job_status: string              // "Complete",
    k3s_pod_name: string                // "cloud-cover-top-1645746942-ckwds"
    k3s_pod_node_name: string           // "000048b02d15bc7c.ws-nxcore"
    k3s_pod_status: string
    plugin_args: string                 //  "-stream left -config-path configs/cocostuff164k.yaml",
    plugin_image: string                // "registry.sagecontinuum.org/namespace/name:0.0.4",
    plugin_name: string                 // "surface-water-detection-left",
    plugin_selector: string             // "map[resource.gpu:true]",
    plugin_status_by_scheduler: string  //  "Queued|"Running"|"Completed"|... todo(nc): get types.
    plugin_task: string                 // "surface-water-detection-left
  }
}


const columns = [{
  id: 'name',
  label: 'Name'
}, {
  id: 'goalID',
  label: 'ID',
  format: (v, obj) => v.split('-')[0]
}, {
  id: 'appCount',
  label: 'Apps',
}, /* {
  id: 'timestamp',
  label: 'Submitted',
  format: (val) => new Date(val).toLocaleString()
}, */ ]

/*
{
  id: 'metrics',
  label: 'Mean Runtimes',
  format: (metrics) =>
    <div>
      <SummaryBar
        displayTime
        values={metrics}
        color={
          Object.keys(metrics).reduce((acc, key, i) =>
            ({...acc, [key]: schemeCategory10[i]})
          , {})
        }
      />
    </div>
}
*/



const startedSignal = 'sys.scheduler.status.plugin.launched'

const endedSignals = [
  'sys.scheduler.status.plugin.complete',
  'sys.scheduler.status.plugin.failed'
]



export type GroupedApps = {
  [app: string]: (
    BH.Record &
    {
      status: 'launched' | 'running' | 'complete' | 'failed'
      runtime: string
    }
  )[]
}



const filterEvents = (o) =>
  startedSignal == o.name || endedSignals.includes(o.name)



function aggregateEvents(data: TaskEvent[]) {

  // we only care about start / end signals (for now)
  const filtered = data.filter(filterEvents)

  if (process.env.NODE_ENV == 'development' && data.length != filtered.length) {
    const otherEvents = data.filter(o => !filterEvents(o))
    console.warn(
      `SES events were filtered from ${data.length} to ${filtered.length}\n`,
      'Other events:', otherEvents
    )
  }

  const byPod = groupBy(filtered, 'value.k3s_pod_name')

  // create lookup by task name
  const byTaskName = {}
  for (const [podName, events] of Object.entries(byPod)) {
    const taskName = podName.slice(0, podName.lastIndexOf('-'))
    events.sort((a, b) => a.timestamp.localeCompare(b.timestamp))

    let hasStart, hasEnd = false

    // assume at most two events (for now)
    if (events.length == 2) {
      hasStart = hasEnd = true
    } else if (events.length == 1) {
      const name = events[0].name
      hasStart = name == startedSignal
      hasEnd = endedSignals.includes(name)
    } else {
      console.warn(
        `parseEvents: wrong number of events for ${podName}.`,
        `found ${events.length} events.  was expecting at most 2`
      )
      continue
    }

    let item
    if (hasStart && hasEnd) {
      const [startObj, endObj] = events
      const end = endObj.timestamp
      item = {
        ...startObj,
        end: end,
        status: endObj.name.split('.').pop(),
        runtime: new Date(end).getTime() -  new Date(startObj.timestamp).getTime()
      }
    } else if (hasEnd) {
      console.warn('todo: add representation for end times with no start?')
      continue
    } else if (hasStart) {
      const startObj = events[0]
      const start = startObj.timestamp

      item = {
        ...startObj,
        end: new Date().toISOString(),
        status: 'running',
        runtime: new Date().getTime() - new Date(start).getTime()
      }

      console.warn(`Note: No end signal found for taskName=${taskName}, timestamp=${start}`)
    }

    if (taskName in byTaskName)
      byTaskName[taskName].push(item)
    else
      byTaskName[taskName] = [item]
  }

  return byTaskName
}


function reduceByNode(taskEvents: TaskEvent[]) {

  // first group by vsn
  const groupedByNode = groupBy(taskEvents, 'meta.vsn')

  // then
  const byNode = {}
  for (const [vsn, events] of Object.entries(groupedByNode)) {
    byNode[vsn] = aggregateEvents(events)
  }

  // organize by orange/red statuses below 'complete'
  // High-level metrics could make this make this clear, in lieu of better design
  for (const [vsn, byApp] of Object.entries(byNode)) {
    for (const [app, objs] of Object.entries(byApp)) {
      byNode[vsn][app] = [
        ...objs.filter(obj => obj.status != 'complete'),
        ...objs.filter(obj => obj.status == 'complete')
      ]
    }
  }

  return byNode
}


function mockGoalMetrics(taskEvents: TaskEvent[]) {
  const byGoal = groupBy(taskEvents, 'value.goal_id')

  const rows = []
  for (const [goalID, events] of Object.entries(byGoal)) {
    const byApp = aggregateEvents(events)

    let name
    const metrics = Object.keys(byApp).reduce((acc, appName) => {
      const appEvents = byApp[appName]
      const meanTime = appEvents.reduce((acc, obj) => acc + obj.runtime, 0) / byApp[appName].length

      if (!name) {
        name = appEvents[0].meta.job
      }

      return {...acc, [appName]: meanTime}
    }, {})

    const apps = Object.keys(byApp)

    rows.push({
      goalID,
      name,
      byApp,
      apps,
      appCount: apps.length,
      metrics
    })
  }

  return rows
}


const parseSESValue = (data) =>
  data.map(o => ({
    ...o,
    value: JSON.parse(o.value as string)
  }))



// fetch tasks state event changes, and parse SES JSON Messages
function getTaskEvents() {
  return BH.getData({
    start: '-48h',
    filter: {
      name: 'sys.scheduler.status.plugin.*'
    }
  }).then(data => parseSESValue(data))
}


function getGoals() {
  return BH.getData({
    start: '-30d',
    filter: {
      name: 'sys.scheduler.status.goal.*',
    }
  }).then(data => parseSESValue(data))
    .then(data => {
      data.sort((a,b) => b.timestamp.localeCompare(a.timestamp))
      return data
    })
}




type GeoData = {id: string, lng: number, lat: number}[]

export default function JobStatus() {
  const {setLoading} = useProgress()

  const [goals, setGoals] = useState<BH.Record[]>()
  const [byNode, setByNode] = useState()
  const [geo, setGeo] = useState<GeoData>()

  const [error, setError] = useState()

  useEffect(() => {
    setLoading(true)
    const proms = [getTaskEvents()]

    Promise.all(proms)
      .then(([taskEvents]) => {
        const byNode = reduceByNode(taskEvents)
        const goals = mockGoalMetrics(taskEvents)

        setByNode(byNode)
        setGoals(goals)

        // also fetch gps for map
        BK.getManifest({by: 'vsn'})
          .then(data => {
            const vsns = Object.keys(byNode)

            const geo = vsns.map(vsn => {
              const d = data[vsn]
              const lng = d.gps_lon
              const lat = d.gps_lat

              return {id: vsn, vsn, lng, lat, status: 'reporting'}
            })

            setGeo(geo)
          })
      })
      .finally(() => setLoading(false))
  }, [])


  const handleSelect = () => {

  }

  return (
    <Root>
      <div className="flex">
        <CustomSidebar width="240px">
          <h2>Science Goals</h2>
          <TableContainer>
            {goals &&
              <Table
                primaryKey="goalID"
                rows={goals}
                columns={columns}
                enableSorting
                onSearch={() => {}}
                onSelect={handleSelect}
              />
            }
          </TableContainer>
        </CustomSidebar>

        <Main className="flex column">
          <MapContainer>
            {geo &&
              <Map data={geo} selected={null} resize={false} updateID={null} />
            }
          </MapContainer>

          <TimelineContainer>
            {byNode && Object.keys(byNode).map((node, i) =>
              <div key={i}>
                <h4>{node}</h4>
                <JobTimeLine data={byNode[node]} />
              </div>
            )}
          </TimelineContainer>

          {error &&
            <Alert severity="error">{error.message}</Alert>
          }
        </Main>
      </div>
    </Root>
  )
}



const Root = styled.div`

`

const CustomSidebar = styled(Sidebar)`
  padding: 0 10px;
`

const Main = styled.div`
  width: 100%;
  margin-bottom: 1400px;
`

const MapContainer = styled.div`
  width: 100%;
`

const TimelineContainer = styled.div`
  padding: 0 1.2em;

  h4 {
    float: left;
    margin: 5px;
  }
`

const TableContainer = styled.div`
  margin-top: 1em;

  & .MuiInputBase-root {
    max-width: 100%;
    background: #fff;
  }

  table {
    background: #fff;

    tr:nth-child(odd) {
      background: none;
    }
    tr.MuiTableRow-root:hover {
      background-color: initial;
    }
  }

  .MuiInputBase-root {
    color: #aaa;
    pointer-events: none;
    background: #f2f2f2;
  }

  .MuiFormControl-root:hover {
    cursor: not-allowed;
  }
`