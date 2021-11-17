import React, { useState, useEffect } from 'react'
import { useHistory, Link} from 'react-router-dom'
import styled from 'styled-components'

import * as BH from '../../apis/beehive'
import * as BK from '../../apis/beekeeper'


import { useProgress } from '../../../components/progress/ProgressProvider'

import TimelineChart, { colors } from '../../viz/TimelineChart'



export default function TestView() {
  const history  = useHistory()

  const { setLoading } = useProgress()
  const [sanity, setSanity] = useState()
  const [health, setHealth] = useState()
  const [manifest, setManifest] = useState(null)

  const [error, setError]= useState()

  useEffect(() => {
    setLoading(true)

    let p1 = BH.getNodeHealth()
      .then((data) => setHealth(data))
      .catch((err) => setError(err))

    let p2 = BH.getDailyChart()
      .then((data) => setSanity(data))
      .catch((err) => setError(err))

    // temp solution for vsn <-> node id
    BK.getManifest({by: 'vsn'})
      .then(data => setManifest(data))
      .catch((err) => setError(err))

    Promise.all([p1, p2])
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
            `${new Date(item.timestamp).toDateString()} ${new Date(item.timestamp).toLocaleTimeString()}<br>
            ${item.meta.device}<br>
            <b style="color: ${item.value == 0 ? colors.red4 : colors.green}">
              ${item.value == 0 ? 'failed' : `success`}
            </b>
            `
          }
        />
      }

      <h2>Sanity Tests</h2>
      {sanity &&
        <TimelineChart
          data={sanity}
          onRowClick={handleLabelClick}
          onCellClick={handleCellClick}
          tooltip={(item) =>
            `${new Date(item.timestamp).toDateString()}<br>
            ${new Date(item.timestamp).toLocaleTimeString()} - ${new Date(new Date(item.timestamp).getTime() + 60*60*1000).toLocaleTimeString()}<br>
            ${item.value == 0 ? 'passed' : (item.meta.severity == 'warning' ? 'warning' : 'failed')}
            (${item.value} issue${item.value == 1 ? '' : 's'})<br><br>
            <small>(click for details)</small>
            `
          }
          showLegend
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
