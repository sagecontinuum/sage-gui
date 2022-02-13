import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { groupBy } from 'lodash'

import { schemeCategory10 } from 'd3-scale-chromatic'

import Alert from '@mui/material/Alert'

import Map from '../../components/Map'
import Table from '../../components/table/Table'
import JobTimeLine from './JobTimeline'
import SummaryBar from '../../admin-ui/views/status/charts/SummaryBar'

import * as BH from '../../admin-ui/apis/beehive'
import { useProgress } from '../../components/progress/ProgressProvider'


const columns = [{
  id: 'vsn',
  label: 'VSN',
  format: (v, obj) => obj.meta.vsn
}, {
  id: 'job',
  label: 'Job',
  format: (v, obj) => obj.meta.job
}, {
  id: 'value',
  label: 'Name'
}, {
  id: 'appCount',
  label: 'Apps',
}, {
  id: 'timestamp',
  label: 'Submitted',
  format: (val) => new Date(val).toLocaleString()
}, {
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


type GroupedGoals = {
  [vsn: string]: BH.Record
}

export type GroupedApps = {
  [app: string]: (
    BH.Record &
    {
      status: 'launched' | 'running' | 'complete' | 'failed'
      runtime: string
    }
  )[]
}


function parseData(data: BH.Record[]) : GroupedApps {
  let grouped : GroupedApps = groupBy(data, 'value')

  for (const [app, items] of Object.entries(grouped)) {
    // sort each list by times
    items.sort((a, b) => a.timestamp.localeCompare(b.timestamp))

    // now find all started/ended pairs and reduce into single objects
    let tasks = []
    let hasStart = false
    items.forEach(item => {
      const name = item.name
      const prevIdx = tasks.length - 1

      // if we have a start signal, add to tasks
      if (name == startedSignal) {
        tasks.push(item)
        hasStart = true
        return

      // if we found start already and have an end signal, complete the task info
      } else if (
        endedSignals.includes(name) && hasStart &&
        tasks[prevIdx].name == startedSignal
      ) {
        const prevTime = tasks[prevIdx].timestamp
        tasks[prevIdx] = {
          ...tasks[prevIdx],
          end: item.timestamp,
          status: name.split('.').pop(),
          runtime: new Date(item.timestamp).getTime() -  new Date(prevTime).getTime()
        }
      // if started, but no end signal, assume running
      } else if (hasStart) {
        tasks[prevIdx] = {
          ...tasks[prevIdx],
          end: new Date().toISOString(),
          status: 'running',
          runtime: new Date().getTime() - new Date(item.timestamp).getTime()
        }
      }

      hasStart = false

      // update list of items
      grouped[app] = tasks
    })
  }

  return grouped
}


// todo(nc): remove
const VSNs = ['W023']


type GeoData = {id: string, lng: number, lat: number}[]

export default function JobStatus() {
  const {setLoading} = useProgress()

  const [goals, setGoals] = useState<BH.Record[]>()
  const [apps, setApps] = useState<GroupedApps>()
  const [geo, setGeo] = useState<GeoData>()


  const [error, setError] = useState()

  useEffect(() => {
    setLoading(true)
    const appProm = BH.getData({
      start: '-12h',
      filter: {
        // name: 'sys.scheduler.*',
        plugin: 'scheduler.*'
      }
    }).then(data => {
      const byVSN = groupBy(data, 'meta.vsn')
      return byVSN
    })

    // fetch goals to mockup concept of "jobs"
    const goalProm = BH.getData({
      start: '-10d',
      filter: {
        name: 'sys.scheduler.newgoal',
      }
    }).then(data => {
      const byVSN : GroupedGoals = groupBy(data, 'meta.vsn')
      const latest = Object.values(byVSN)
        .reduce((acc, objs) => ([...acc, objs.pop()]), [])
      return latest
    })

    Promise.all([appProm, goalProm])
      .then(([appsByVsn, goals]) => {
        const vsn = VSNs[0]
        const apps = appsByVsn[vsn]
        const grouped = parseData(apps)
        setApps(grouped)

        // join in apps to goals and some simple metrics
        const uniqueApps = Object.keys(grouped)
        const appCount = uniqueApps.length
        const metrics = Object.keys(grouped).reduce((acc, appName) => {
          const meanTime = grouped[appName].reduce((acc, obj) => acc + obj.runtime, 0) / grouped[appName].length
          return {
            ...acc,
            [appName]: meanTime
          }
        }, {})

        goals = goals.map(obj => ({...obj, appCount, uniqueApps, metrics}))

        // also fetch gps for map
        BH.getData({
          start: '-4h',
          filter: {
            name: 'sys.gps.l.*',
          },
          tail: 1
        }).then(gps => {
          const byVSN = groupBy(gps, 'meta.vsn')
          const entries = byVSN[vsn]
          const lng = entries.find(o => o.name == 'sys.gps.lon').value
          const lat = entries.find(o => o.name == 'sys.gps.lat').value

          setGeo([{id: vsn, vsn, lng, lat, status: 'reporting'}])
        })

        setGoals(goals)
      })
      .finally(() => setLoading(false))
  }, [])


  const handleSelect = () => {

  }

  return (
    <Root>
      <h1>Job Status | <small>Last 12 hours</small></h1>

      <Charts className="flex">
        {geo && <Map data={geo} selected={null} resize={false} />}

        <TimelineContainer className="flex column" >
          <JobTimeLine data={apps} />
        </TimelineContainer>
      </Charts>

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

const Charts = styled.div`

`

const TimelineContainer = styled.div`
  width: 50%;
`

const TableContainer = styled.div`
  margin-top: 1em;
`