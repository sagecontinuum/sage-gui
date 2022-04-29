import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import HelpIcon from '@mui/icons-material/HelpOutlineRounded'
import Tooltip from '@mui/material/Tooltip'

import ErrorMsg from '/apps/sage/ErrorMsg'
import * as BH from '/components/apis/beehive'
import * as BK from '/components/apis/beekeeper'

import { useProgress } from '/components/progress/ProgressProvider'
import TimelineChart, { color } from '../../viz/TimelineChart'


const timeOpts = { hour: '2-digit', minute:'2-digit' }
const dateOpts = { weekday: 'short', month: 'short', day: 'numeric' }


function getDateTimeStr(timestamp) {
  return (
    `${new Date(timestamp).toLocaleDateString('en-US', dateOpts)}<br>
    ${new Date(timestamp).toLocaleTimeString('en-US', timeOpts)} - ${new Date(new Date(timestamp).getTime() + 60*60*1000).toLocaleTimeString('en-US', timeOpts)}`
  )
}


const reduceByVSNs = (data: BH.ByMetric, vsns: string[]) =>
  Object.keys(data)
    .reduce((acc, vsn) =>
      vsns.includes(vsn) ? {...acc, [vsn]: data[vsn]} : acc
    , {})



const getHealthColor = (val: number) => {
  if (val == null)
    return color.noValue
  return val == 0 ? color.red4 : color.green
}


const healthTooltip = (item) =>
  `${getDateTimeStr(item.timestamp)}<br>
  Node: ${item.meta.vsn}<br>
  <b style="color: ${item.value == 0 ? color.red3 : color.green}">
    ${item.value == 0 ? 'failed' : `success`}
  </b><br><br>
  <small class="muted">(click for details)</small>
  `


const sanityTooltip = (item) =>
  `${getDateTimeStr(item.timestamp)}<br>
  Node: ${item.meta.vsn}<br>
  <b style="color: ${item.value == 0 ? color.green : color.red3}">
  ${item.value == 0 ? 'passed' : (item.meta.severity == 'warning' ? 'warning' : 'failed')}
  </b>
  (${item.value} issue${item.value == 1 ? '' : 's'})<br><br>
  <small class="muted">(click for details)</small>
  `


export default function TestView() {
  const navigate = useNavigate()

  const { setLoading } = useProgress()
  const [sanity, setSanity] = useState<{dev: BH.ByMetric, prod: BH.ByMetric}>()
  const [health, setHealth] = useState<{dev: BH.ByMetric, prod: BH.ByMetric}>()
  const [manifest, setManifest] = useState<BK.ManifestMap>(null)

  const [error, setError]= useState(null)

  useEffect(() => {
    setLoading(true)

    const p1 = BH.getNodeHealth(null, '-7d')
    const p2 = BH.getNodeSanity('-7d')
    const p3 = BK.getManifest({by: 'vsn'})  // temp solution for vsn <-> node id

    Promise.all([p1, p2, p3])
      .then(([health, sanity, meta]) => {

        // sort sanity by node vsn
        sanity = Object.keys(sanity)
          .sort()
          .reduce((acc, key) => (acc[key] = sanity[key], acc), {})

        // only consider WSN nodes with node_id
        const includeList = Object.values(meta)
          .filter(o => o.node_id.length && o.node_type !== 'Blade')

        const prodVSNs = includeList
          .filter(o => o.commission_date.length)
          .map(o => o.vsn)

        const devVSNs = includeList
          .filter(o => !o.commission_date.length)
          .map(o => o.vsn)

        let prod = reduceByVSNs(health, prodVSNs)
        let dev = reduceByVSNs(health, devVSNs)
        setHealth({dev, prod})

        prod = reduceByVSNs(sanity, prodVSNs)
        dev = reduceByVSNs(sanity, devVSNs)
        setSanity({dev, prod})

        setManifest(meta)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))

  }, [setLoading])


  const handleCellClick = (item) => {
    const vsn = item.meta.vsn
    const nodeId = manifest[vsn].node_id
    navigate(`/node/${nodeId}`)
  }

  const handleLabelClick = (label) => {
    const nodeId = manifest[label].node_id
    navigate(`/node/${nodeId}`)
  }


  return (
    <Root>
      <h1>
        Production
        <sup>
          <Tooltip title={`Nodes with commission dates`} placement="right">
            <HelpIcon style={{fontSize: '.75em'}}/>
          </Tooltip>
        </sup>
      </h1>

      {health &&
        <>
          <h2>Health</h2>
          <TimelineChart
            data={health.prod}
            onRowClick={handleLabelClick}
            onCellClick={handleCellClick}
            colorCell={getHealthColor}
            tooltip={healthTooltip}
            tailHours={72}
          />
        </>
      }

      {error && <ErrorMsg>{error}</ErrorMsg>}

      {sanity &&
        <>
          <h2>Sanity Tests</h2>
          <TimelineChart
            data={sanity.prod}
            onRowClick={handleLabelClick}
            onCellClick={handleCellClick}
            tooltip={sanityTooltip}
            tailHours={72}
          />
        </>
      }
      {error && <ErrorMsg>{error}</ErrorMsg>}

      <h1>
        Development
        <sup>
          <Tooltip title={`Nodes without commission dates`} placement="right">
            <HelpIcon style={{fontSize: '.75em'}}/>
          </Tooltip>
        </sup>
      </h1>

      {health &&
        <>
          <h2>Health</h2>
          <TimelineChart
            data={health.dev}
            onRowClick={handleLabelClick}
            onCellClick={handleCellClick}
            colorCell={getHealthColor}
            tooltip={healthTooltip}
            tailHours={72}
          />
        </>
      }
      {error && <ErrorMsg>{error}</ErrorMsg>}

      {sanity &&
        <>
          <h2>Sanity Tests</h2>
          <TimelineChart
            data={sanity.dev}
            onRowClick={handleLabelClick}
            onCellClick={handleCellClick}
            tooltip={sanityTooltip}
            tailHours={72}
          />
        </>
      }
      {error && <ErrorMsg>{error}</ErrorMsg>}
    </Root>
  )
}

const Root = styled.div`
  margin: 1em;

  h1 {
    border-bottom: 1px solid rgb(216, 222, 228);
    margin-bottom: 1em;
  }

  h2 {
    margin: 0 0 0 115px;
    float: left;
  }
`
