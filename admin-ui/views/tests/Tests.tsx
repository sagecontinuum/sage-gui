import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import styled from 'styled-components'

import * as BH from '~/components/apis/beehive'
import * as BK from '~/components/apis/beekeeper'

import { useProgress } from '~/components/progress/ProgressProvider'
import TimelineChart, { colors } from '../../viz/TimelineChart'


const timeOpts = { hour: '2-digit', minute:'2-digit' }
const dateOpts = { weekday: 'short', month: 'short', day: 'numeric' }


function getDateTimeStr(timestamp) {
  return (
    `${new Date(timestamp).toLocaleDateString('en-US', dateOpts)}<br>
    ${new Date(timestamp).toLocaleTimeString('en-US', timeOpts)} - ${new Date(new Date(timestamp).getTime() + 60*60*1000).toLocaleTimeString('en-US', timeOpts)}`
  )
}



export default function TestView() {
  const history  = useHistory()

  const { setLoading } = useProgress()
  const [sanity, setSanity] = useState<BH.AggMetrics>()
  const [health, setHealth] = useState<BH.AggMetrics>()
  const [manifest, setManifest] = useState<BK.ManifestMap>(null)

  const [error, setError]= useState()

  useEffect(() => {
    setLoading(true)

    let p1 = BH.getNodeHealth(null, '-7d')
      .catch((err) => setError(err))

    let p2 = BH.getNodeSanity('-7d')
      .catch((err) => setError(err))

    // temp solution for vsn <-> node id
    const p3 = BK.getManifest({by: 'vsn'})
      .catch((err) => setError(err))

    Promise.all([p1, p2, p3])
      .then(([health, sanity, meta]) => {
        const vsns = Object.values(meta)
          .filter(o => o.node_id?.length && o.node_type !== 'Dell')
          .map(o => o.vsn)

        const healthSubset = Object.keys(health)
          .reduce((acc, vsn) =>
            vsns.includes(vsn) ? {...acc, [vsn]: health[vsn]} : acc
          , {})

        setManifest(meta)
        setHealth(healthSubset)
        setSanity(sanity)
      })
      .finally(() => setLoading(false))

  }, [setLoading])


  const handleCellClick = (item) => {
    const vsn = item.meta.vsn
    const nodeId = manifest[vsn].node_id
    history.push(`/node/${nodeId}`)
  }

  const handleLabelClick = (label) => {
    const nodeId = manifest[label].node_id
    history.push(`/node/${nodeId}`)
  }


  return (
    <Root>
      <h1>All Nodes</h1>

      <h2>Health</h2>
      {health &&
        <TimelineChart
          data={health}
          onRowClick={handleLabelClick}
          onCellClick={handleCellClick}
          colorCell={(val, obj) => {
            if (val == null)
              return colors.noValue
            return val == 0 ? colors.red4 : colors.green
          }}
          tooltip={(item) =>
            `${getDateTimeStr(item.timestamp)}<br>
            Node: ${item.meta.vsn}<br>
            <b style="color: ${item.value == 0 ? colors.red3 : colors.green}">
              ${item.value == 0 ? 'failed' : `success`}
            </b><br><br>
            <small class="muted">(click for details)</small>
            `
          }
          tailHours={48}
        />
      }

      <h2>Sanity Tests</h2>
      {sanity &&
        <TimelineChart
          data={sanity}
          onRowClick={handleLabelClick}
          onCellClick={handleCellClick}
          tooltip={(item) =>
            `${getDateTimeStr(item.timestamp)}<br>
            <b style="color: ${item.value == 0 ? colors.green : colors.red3}">
             ${item.value == 0 ? 'passed' : (item.meta.severity == 'warning' ? 'warning' : 'failed')}
             </b>
             (${item.value} issue${item.value == 1 ? '' : 's'})<br><br>
            <small class="muted">(click for details)</small>
            `
          }
          tailHours={48}
        />
      }
    </Root>
  )
}

const Root = styled.div`
 h2 {
   width: 100%;
 }
`
