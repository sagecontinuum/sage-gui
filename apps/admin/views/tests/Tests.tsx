import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import HelpIcon from '@mui/icons-material/HelpOutlineRounded'
import Tooltip from '@mui/material/Tooltip'

import ErrorMsg from '/apps/sage/ErrorMsg'
import FilterMenu from '/components/FilterMenu'
import * as BH from '/components/apis/beehive'
import * as BK from '/components/apis/beekeeper'

import { useProgress } from '/components/progress/ProgressProvider'
import TimelineChart, { color } from '/components/viz/Timeline'
import { endOfHour, subDays } from 'date-fns'

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

  const [bucket, setBucket] = useState<'All' | BK.Manifest['bucket']>('1 Production')

  const [error, setError]= useState(null)

  useEffect(() => {
    setLoading(true)

    const p1 = BH.getNodeHealth(null, '-7d')
    const p2 = BH.getNodeSanity('-7d')
    const p3 = BK.getProdSheet({by: 'vsn'})  // temp solution for vsn <-> node id

    Promise.all([p1, p2, p3])
      .then(([health, sanity, meta]) => {
        // sort sanity by node vsn
        sanity = Object.keys(sanity)
          .sort()
          .reduce((acc, key) => (acc[key] = sanity[key], acc), {})

        // only consider WSN nodes with node_id
        const includeList = Object.values(meta)
          .filter(o => o.node_id.length)

        const vsns = includeList
          .filter(o => bucket == 'All' || o.bucket == bucket)
          .map(o => o.vsn)

        let d = reduceByVSNs(health, vsns)
        setHealth(d)

        d = reduceByVSNs(sanity, vsns)

        setSanity(d)
        setManifest(meta)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))

  }, [setLoading, bucket])


  const handleCellClick = (item) => {
    const vsn = item.meta.vsn
    const nodeId = manifest[vsn].node_id
    navigate(`/node/${nodeId}`)
  }

  const handleLabelClick = (label) => {
    const nodeId = manifest[label].node_id
    navigate(`/node/${nodeId}`)
  }

  const allNodesItem = {id: 'All', label: 'All'}

  return (
    <Root>
      <div className="flex items-center">
        <b>Nodes:</b>
        <FilterMenu
          multiple={false}
          disableCloseOnSelect={false}
          label={bucket.slice(bucket.indexOf(' ') + 1) || bucket}
          options={[allNodesItem, ...BK.Buckets.map(v => ({id: v, label: v}))] }
          value={{id: bucket, label: bucket}}
          onChange={val => setBucket(val.id)}
          noSelectedSort
        />
      </div>

      <br/>

      {health &&
        <>
          <h2>Health</h2>
          <TimelineChart
            data={health}
            startTime={subDays(new Date(), 3)}
            endTime={endOfHour(new Date())}
            onRowClick={handleLabelClick}
            onCellClick={handleCellClick}
            colorCell={getHealthColor}
            tooltip={healthTooltip}
          />
        </>
      }

      {error && <ErrorMsg>{error}</ErrorMsg>}

      <br/>

      {sanity && Object.keys(sanity).find(vsn => sanity[vsn].length) &&
        <>
          <h2>Sanity Tests</h2>
          <TimelineChart
            data={sanity}
            startTime={subDays(new Date(), 3)}
            endTime={endOfHour(new Date())}
            onRowClick={handleLabelClick}
            onCellClick={handleCellClick}
            tooltip={sanityTooltip}
          />
        </>
      }
      {error && <ErrorMsg>{error}</ErrorMsg>}
    </Root>
  )
}

const Root = styled.div`
  margin: 2rem auto;
  width: 80%;

  h1 {
    border-bottom: 1px solid rgb(216, 222, 228);
    margin-bottom: 1em;
  }

  h2 {
    margin: 0 0 0;
    float: left;
  }
`
