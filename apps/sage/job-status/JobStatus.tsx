import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { groupBy } from 'lodash'

import { schemeCategory10 } from 'd3-scale-chromatic'

import Alert from '@mui/material/Alert'

import Map from '/components/Map'
import Table from '/components/table/Table'
import JobTimeLine from './JobTimeline'
import SummaryBar from '/apps/admin-ui/views/status/charts/SummaryBar'

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
    plugin_args: string                 //  "-stream left -model-path deeplabv2_resnet101_msc-cocostuff164k-100000.pth -config-path configs/cocostuff164k.yaml",
    plugin_image: string                // "registry.sagecontinuum.org/seonghapark/surface-water-detection:0.0.4",
    plugin_name: string                 // "surface-water-detection-left",
    plugin_selector: string             // "map[resource.gpu:true]",
    plugin_status_by_scheduler: string  //  "Queued|"Running"|"Completed"|... todo(nc): get types.
    plugin_task: string                 // "surface-water-detection-left-1645641900"
  }
}


const columns = [{
  id: 'goalID',
  label: 'ID',
  format: (v, obj) => v.split('-')[0]
}, {
  id: 'appCount',
  label: 'Apps',
}, /*{
  id: 'timestamp',
  label: 'Submitted',
  format: (val) => new Date(val).toLocaleString()
}, */ {
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
}]



const startedSignal = "sys.scheduler.status.plugin.launched"

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


function aggregateEvents(data: TaskEvent[]) {
  // we only care about start / end signals (for now, anyway)
  data = data.filter(o => startedSignal == o.name || endedSignals.includes(o.name))

  let byTaskIDs = groupBy(data, 'value.plugin_task')

  // note: app is an overloaded term here.  it's really more like a taskname
  const byTaskName = {}
  for (const [taskID, events] of Object.entries(byTaskIDs)) {
    const taskName = taskID.slice(0, taskID.lastIndexOf('-'))
    events.sort((a, b) => a.timestamp.localeCompare(b.timestamp))

    let hasStart, hasEnd = false

    // assume at most two events (for now, anyway)
    if (events.length == 2) {
      hasStart = hasEnd = true
    } else if (events.length == 1) {
      const name = events[0].name
      hasStart = name == startedSignal
      hasEnd = endedSignals.includes(name)
    } else {
      console.warn(`parseEvents: wrong number of events for ${taskID}.  found ${events.length} events.  expecting at most 2`)
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

      console.warn(`Note: No end signal found for taskID=${taskID}, timestamp=${start}`)
    }

    if (taskName in byTaskName)
      byTaskName[taskName].push(item)
    else
      byTaskName[taskName] = [item]
  }

  return byTaskName
}


function reduceByNode(taskEvents: TaskEvent[]) {
  let groupedByNode = groupBy(taskEvents, 'meta.vsn')

  let byNode = {}
  for (const [vsn, events] of Object.entries(groupedByNode)) {
    byNode[vsn] = aggregateEvents(events)
  }

  return byNode
}


function mockGoalMetrics(taskEvents: TaskEvent[]) {
  const byGoal = groupBy(taskEvents, 'value.goal_id')

  let rows = []
  for (const [goal_id, events] of Object.entries(byGoal)) {
    const byApp = aggregateEvents(events)

    const metrics = Object.keys(byApp).reduce((acc, appName) => {
      const meanTime = byApp[appName].reduce((acc, obj) => acc + obj.runtime, 0) / byApp[appName].length
      return {
        ...acc,
        [appName]: meanTime
      }
    }, {})

    const apps = Object.keys(byApp)

    rows.push({
      goalID: goal_id,
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
    start: '-2h',
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
      <Top className="flex">
        <div>
          <h1 className="no-margin">App Status</h1>
          <h2 className="no-margin">Last 24 hours</h2>
        </div>

        <MapContainer>
          {geo &&
            <Map data={geo} selected={null} resize={false} />
          }
        </MapContainer>

      </Top>


          <TimelineContainer className="flex column" >
            {byNode &&
              <JobTimeLine data={byNode['W023']} />
            }
          </TimelineContainer>

      {error &&
        <Alert severity="error">{error.message}</Alert>
      }

      <TableContainer>
        {goals &&
          <Table
            primaryKey="timestamp" // todo(nc): need job ids
            rows={goals}
            columns={columns}
            enableSorting
            onSearch={() => {}}
            onColumnMenuChange={() => {}}
            onSelect={handleSelect}
          />
        }
      </TableContainer>
    </Root>
  )
}

const Root = styled.div`
  margin: 1em;
`

const Top = styled.div`
  h1 {
    width: 150px;
  }
`

const MapContainer = styled.div`
  width: 100%;
`

const TimelineContainer = styled.div`

`

const TableContainer = styled.div`
  margin-top: 1em;
`