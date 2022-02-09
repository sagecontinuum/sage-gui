import { useEffect, useState } from 'react'
import styled from 'styled-components'

import {groupBy} from 'lodash'

import * as BH from '../../admin-ui/apis/beehive'
import { useProgress } from '../../components/progress/ProgressProvider'

import TimelineChart from '../../admin-ui/viz/TimelineChart'



const startedSignal = "sys.scheduler.status.plugin.launched"

const endedSignals = [
  "sys.scheduler.status.plugin.complete",
  "sys.scheduler.status.plugin.failed"
]

function parseData(data) {
  const grouped = groupBy(data, 'value')

  for (const [key, items] of Object.entries(grouped)) {
    // sort each list by times
    items.sort((a, b) => a.timestamp.localeCompare(b.timestamp))

    // now find all started/ended pairs and reduce into single objects
    let tasks = []
    let started = false
    items.forEach(item => {
      const name = item.name

      if (name == startedSignal) {
        tasks.push(item)
        started = true
      }

      if (started && endedSignals.includes(name)) {
        tasks[tasks.length - 1] = {
          ...tasks[tasks.length - 1],
          end: item.timestamp,
          status: name
        }

        delete tasks[tasks.length - 1].name

        started = false
      }

      // update list of items and all "ended" entries
      grouped[key] = tasks.filter(o => !endedSignals.includes(o.name))
    })
  }

  return grouped
}


type Props = {}

export default function JobStatus(props: Props) {
  const {setLoading} = useProgress()
  const [data, setData] = useState()

  useEffect(() => {
    setLoading(true)
    BH.getData({start: '-10h', filter: {name: 'sys.scheduler.*'}})
      .then(data => {
        const grouped = parseData(data)
        setData(grouped)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <Root>
      <h1>Job Status</h1>

      {data &&
        <TimelineChart
          data={data}
          tooltip={(obj) => `<pre>${JSON.stringify(obj, null, 4)}</pre>`}
          onRowClick={(val, data) => console.log('row click', val, data)}
          onCellClick={(data) => console.log('cell click', data)}
        />
      }
    </Root>
  )
}

const Root = styled.div`
  margin: 1em;
`
