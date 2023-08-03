import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'

import { Autocomplete, Popper, TextField } from '@mui/material'

import ErrorMsg from '/apps/sage/ErrorMsg'
import * as BH from '/components/apis/beehive'
import * as BK from '/components/apis/beekeeper'

import { parseQueryStr } from '/components/utils/queryString'
import { useProgress } from '/components/progress/ProgressProvider'
import TimelineChart, { color } from '/components/viz/Timeline'
import { endOfHour, subDays } from 'date-fns'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '/components/input/Checkbox'

import { reduce, union } from 'lodash'


const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute:'2-digit' }
const dateOpts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }


function getDateTimeStr(timestamp) {
  return (
    `${new Date(timestamp).toLocaleDateString('en-US', dateOpts)}<br>
    ${new Date(timestamp).toLocaleTimeString('en-US', timeOpts)} -
    ${new Date(new Date(timestamp).getTime() + 60*60*1000).toLocaleTimeString('en-US', timeOpts)}`
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
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const phase = params.get('phase') as BK.PhaseTabs
  // const test = params.get('test')
  // const testType = params.get('test_type')

  const state = parseQueryStr<{test: String, test_type: string}>(params, {multiple: false})
  const test = state.test
  const testType = state.test_type

  const { setLoading } = useProgress()
  const [sanity, setSanity] = useState<{dev: BH.ByMetric, prod: BH.ByMetric}>()
  const [health, setHealth] = useState<{dev: BH.ByMetric, prod: BH.ByMetric}>()
  const [vsns, setVSNs] = useState<BK.VSN>()

  const [testList, setTestList] = useState()
  const [testsByVSN, setTestsByVSN] = useState<{dev: BH.ByMetric, prod: BH.ByMetric}>()

  const [showBlades, setShowBlades] = useState(false)

  const [error, setError]= useState(null)

  useEffect(() => {
    setLoading(true)

    const p1 = BH.getHealthData({start: '-14d'})
    const p2 = BH.getSanitySummary({start: '-14d'})
    const p3 = BK.getNodeMeta()

    Promise.all([p1, p2, p3])
      .then(([health, sanity, meta]) => {
        if (!showBlades) {
          health = Object.keys(health).reduce((acc, key) =>
            key.charAt(0) == 'V' ? acc : {...acc, [key]: health[key]}
          , {})
          sanity = Object.keys(sanity).reduce((acc, key) =>
            key.charAt(0) == 'V' ? acc : {...acc, [key]: sanity[key]}
          , {})
        }

        // sort sanity by node vsn
        sanity = Object.keys(sanity)
          .sort()
          .reduce((acc, key) => (acc[key] = sanity[key], acc), {})

        const vsns = Object.values(meta)
          .filter(o => phase ? o.node_phase_v3 == BK.phaseMap[phase] : true)
          .map(o => o.vsn)
        setVSNs(vsns)

        let d = reduceByVSNs(health, vsns)
        setHealth(d)

        d = reduceByVSNs(sanity, vsns)

        setSanity(d)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))

  }, [setLoading, phase, showBlades])


  // dropdown
  useEffect(() => {
    const args = {start: '-2h'}

    // get list of recent metrics for selector
    Promise.all([BH.getDeviceHealthSummary(args), BH.getSanityData(args)])
      .then(([health, sanity]) => {

        // get list of recent metrics
        let d = Object.values(health).map(obj => Object.keys(obj))
        let uniqHealthStrs = union(...d)

        d = Object.values(sanity).map(obj => Object.keys(Object.values(obj)[0]))
        let uniqSanityStrs = union(...d)

        const items = [
          ...uniqHealthStrs.map(l => ({id: l, label: `${l} (health)`})),
          ...uniqSanityStrs.map(l => ({id: l, label: `${l} (sanity)`}))
        ]

        setTestList(items)
      })
  }, [])


  useEffect(() => {
    if (!vsns || !test) return
    setTestsByVSN(null)

    const args = {start: '-14d', device: test}
    BH.getDeviceHealthSummary(args)
      .then((data) => {
        let d = {}
        for (const [vsn, obj] of Object.entries(data)) {
          d[vsn] = obj[test]
        }

        if (!showBlades) {
          d = Object.keys(d).reduce((acc, key) =>
            key.charAt(0) == 'V' ? acc : {...acc, [key]: d[key]}
          , {})
        }

        d = reduceByVSNs(d, vsns)

        setTestsByVSN(d)
      })
  }, [test, phase, vsns, showBlades])



  const handleCellClick = (item) => {
    const vsn = item.meta.vsn
    navigate(`/node/${vsn}?tab=health`)
  }

  const handleLabelClick = (label) => {
    navigate(`/node/${label}?tab=health`)
  }


  const handleChange = (val) => {
    if (!val) {
      navigate(`?phase=${phase}`)
      return
    }

    const {id} = val
    navigate(`?phase=${phase}&test=${id}&test_type=health`)
  }

  return (
    <Root>
      <div className="flex gap">
        <FormControlLabel
          control={
            <Checkbox
              checked={showBlades}
              onChange={(evt) => setShowBlades(evt.target.checked)}
            />
          }
          label="Show blades"
        />

        {/* hide for now
        testList &&
          <Autocomplete
            options={testList}
            renderInput={(props) =>
              <TextField {...props} label="Tests" />}
            PopperComponent={(props) =>
              <Popper {...props} />}
            isOptionEqualToValue={(opt, val) => val ? opt.id == val.id : false}
            value={test ? {id: test, label: `${test} (${testType})`} : undefined}
            onChange={(evt, val) => handleChange(val)}
            style={{width: 400}}
          />
        */}
      </div>

      <br/>

      {!test && health &&
        <>
          <h2>Health</h2>
          <TimelineChart
            data={health}
            startTime={subDays(new Date(), 7)}
            endTime={endOfHour(new Date())}
            onRowClick={handleLabelClick}
            onCellClick={handleCellClick}
            colorCell={getHealthColor}
            tooltip={healthTooltip}
          />
          {error && <ErrorMsg>{error}</ErrorMsg>}
        </>
      }

      <br/>

      {!test && sanity && Object.keys(sanity).find(vsn => sanity[vsn].length) &&
        <>
          <h2>Sanity Tests</h2>
          <TimelineChart
            data={sanity}
            startTime={subDays(new Date(), 7)}
            endTime={endOfHour(new Date())}
            onRowClick={handleLabelClick}
            onCellClick={handleCellClick}
            tooltip={sanityTooltip}
          />
          {error && <ErrorMsg>{error}</ErrorMsg>}
        </>
      }


      {/* by test results */}
      {test && testsByVSN &&
        <>
          <h2>{test} Health</h2>
          <TimelineChart
            data={testsByVSN}
            startTime={subDays(new Date(), 7)}
            endTime={endOfHour(new Date())}
            onRowClick={handleLabelClick}
            onCellClick={handleCellClick}
            colorCell={getHealthColor}
            tooltip={healthTooltip}
          />
        </>
      }

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
