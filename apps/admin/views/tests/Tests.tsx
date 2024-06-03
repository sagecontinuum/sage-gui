import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import styled from 'styled-components'

import { Autocomplete, Button, Popper, TextField } from '@mui/material'
import GitHubIcon from '@mui/icons-material/GitHub'
import FormControlLabel from '@mui/material/FormControlLabel'

import ErrorMsg from '/apps/sage/ErrorMsg'
import * as BH from '/components/apis/beehive'
import * as BK from '/components/apis/beekeeper'

import { parseQueryStr } from '/components/utils/queryString'
import { useProgress } from '/components/progress/ProgressProvider'
import TimelineChart, { color } from '/components/viz/Timeline'
import { endOfHour, subDays } from 'date-fns'
import Checkbox from '/components/input/Checkbox'

import { union } from 'lodash'


const DEFAULT_VIEW = 7  // days
const start = '-14d'    // query start

const healthGithubURL = 'https://github.com/search?q=repo%3Awaggle-sensor%2Fnode-health-reporter'
const sanityGithubURL = 'https://github.com/search?q=repo%3Awaggle-sensor%2Fwaggle-sanity-check'

const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute:'2-digit' }
const dateOpts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }


function getDateTimeStr(timestamp) {
  return (
    `${new Date(timestamp).toLocaleDateString('en-US', dateOpts)}<br>
    ${new Date(timestamp).toLocaleTimeString('en-US', timeOpts)} -
    ${new Date(new Date(timestamp).getTime() + 60*60*1000).toLocaleTimeString('en-US', timeOpts)}`
  )
}


const reduceByVSNs = (data: BH.ByMetric, vsns: string[]) : {[vsn: BK.VSN]: BH.Record[]} =>
  Object.keys(data)
    .reduce((acc, vsn) =>
      vsns.includes(vsn) ? {...acc, [vsn]: data[vsn]} : acc
    , {})


const sortByVSN = (data) =>
  Object.keys(data)
    .sort()
    .reduce((acc, key) => (acc[key] = data[key], acc), {})


const getHealthColor = (val: number) => {
  if (val == null)
    return color.noValue
  return val == 0 ? color.red4 : color.green
}


const getSanityTestColor = (val: number) => {
  if (val == null)
    return color.noValue
  return val == 0 ? color.green : color.red4
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

// tooltip for filtering to specific sanity tests
const sanityTestTooptip = (item) =>
  `${new Date(item.timestamp).toLocaleDateString('en-US', dateOpts)}<br>
   ${new Date(item.timestamp).toLocaleTimeString('en-US', timeOpts)}
    Node: ${item.meta.vsn}<br>
    <b style="color: ${item.value == 0 ? color.green : color.red3}">
      ${item.value == 0 ? 'success' : `failed`}
    </b><br><br>
    <small class="muted">(click for details)</small>
    `

const yFormat = vsn =>
  <Link to={`/node/${vsn}?tab=health`} target="_blank" className="text-inherit">{vsn}</Link>


type TestOption = {
  id: string,
  label: string,
  testType: 'health' | 'sanity'
}



export default function TestView() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const phase = params.get('phase') as BK.PhaseTabs

  const state = parseQueryStr<{test: string, test_type: string}>(params, {multiple: false})
  const test = state.test
  const testType = state.test_type

  const { loading, setLoading } = useProgress()
  const [sanity, setSanity] = useState<BH.ByMetric>()
  const [health, setHealth] = useState<BH.ByMetric>()
  const [vsns, setVSNs] = useState<BK.VSN[]>()

  const [testList, setTestList] = useState<TestOption[]>()
  const [testsByVSN, setTestsByVSN] = useState<{dev: BH.ByMetric, prod: BH.ByMetric}>()

  const [showBlades, setShowBlades] = useState(false)

  const [error, setError]= useState(null)


  // dropdown for filtering to specific tests
  useEffect(() => {
    const args = {start: '-5h', tail: 1}

    // get list of recent metrics for selector
    Promise.all([BH.getDeviceHealthSummary(args), BH.getSanityData(args)])
      .then(([health, sanity]) => {

        // get list of recent metrics
        let d = Object.values(health).map(obj => Object.keys(obj))
        const uniqHealthStrs = union(...d)

        d = Object.values(sanity).map(obj => Object.keys(Object.values(obj)[0]))
        const uniqSanityStrs = union(...d)

        const items = [
          ...uniqHealthStrs.map(l => ({id: l, label: l, testType: 'health'})),
          ...uniqSanityStrs.map(l => ({id: l, label: l.split('.').pop(), testType: 'sanity'}))
        ]

        setTestList(items)
      })
  }, [])


  useEffect(() => {
    setVSNs(null)
    setLoading(true)

    BK.getNodes()
      .then((nodes) => {
        const vsns = nodes
          .filter(o => phase ? o.phase == BK.phaseMap[phase] : true)
          .map(o => o.vsn)
        setVSNs(vsns)
      }).finally(() => setLoading(false))
  }, [setLoading, phase])


  // fetch data for aggregation of all tests, if no tests are selected
  useEffect(() => {
    if (!vsns || test) return

    setLoading(true)

    const p1 = BH.getHealthData({start})
    const p2 = BH.getSanitySummary({start})

    Promise.all([p1, p2])
      .then(([health, sanity]) => {
        if (!showBlades) {
          health = Object.keys(health).reduce((acc, key) =>
            key.charAt(0) == 'V' ? acc : {...acc, [key]: health[key]}
          , {})
          sanity = Object.keys(sanity).reduce((acc, key) =>
            key.charAt(0) == 'V' ? acc : {...acc, [key]: sanity[key]}
          , {})
        }

        const healthData = reduceByVSNs(health, vsns)
        setHealth(healthData)

        sanity = reduceByVSNs(sanity, vsns)
        sanity = sortByVSN(sanity)
        setSanity(sanity)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))

  }, [setLoading, phase, showBlades, vsns, test])


  // load health data if specific tests are selected
  useEffect(() => {
    if (!vsns) return
    if (!test || testType != 'health') return

    setTestsByVSN(null)

    setLoading(true)
    const args = {start, device: test}
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
      .finally(() => setLoading(false))
  }, [setLoading, test, testType, vsns, showBlades])


  // load sanity data if specific tests are selected
  useEffect(() => {
    if (!vsns) return
    if (!test || testType != 'sanity') return

    setTestsByVSN(null)

    setLoading(true)
    const args = {start, name: test}
    BH.getSanityData(args)
      .then((data) => {
        let d = {}
        for (const [vsn, obj] of Object.entries(data)) {
          d[vsn] = Object.values(obj)[0][test]
        }

        if (!showBlades) {
          d = Object.keys(d).reduce((acc, key) =>
            key.charAt(0) == 'V' ? acc : {...acc, [key]: d[key]}
          , {})
        }

        d = reduceByVSNs(d, vsns)
        d = sortByVSN(d)
        setTestsByVSN(d)
      })
      .finally(() => setLoading(false))
  }, [setLoading, test, testType, vsns, showBlades])

  const handleCellClick = (item) => {
    const vsn = item.meta.vsn
    navigate(`/node/${vsn}?tab=health`)
  }

  const handleLabelClick = (label) => {
    navigate(`/node/${label}?tab=health`)
  }


  const handleChange = (val: TestOption) => {
    if (!val) {
      navigate(`?phase=${phase}`)
      return
    }

    const {id, testType} = val
    navigate(`?phase=${phase}&test=${id}&test_type=${testType}`)
  }


  return (
    <Root>
      <div className="flex gap">
        {testList &&
          <Autocomplete
            options={testList}
            groupBy={(option) => option.testType}
            renderInput={(props) =>
              <TextField {...props} label="Tests" />}
            PopperComponent={(props) =>
              <Popper {...props} />}
            isOptionEqualToValue={(opt, val) => val ? opt.id == val.id && opt.testType == val.testType : false}
            value={test ? {id: test, label: test, testType} : undefined}
            onChange={(evt, val) => handleChange(val)}
            style={{width: 400}}
          />
        }

        <FormControlLabel
          control={
            <Checkbox
              checked={showBlades}
              onChange={(evt) => setShowBlades(evt.target.checked)}
            />
          }
          label="Show blades"
        />
      </div>

      <br/>

      {!loading && !test && health &&
        <>
          <h2>Health</h2>
          <TimelineChart
            data={health}
            startTime={subDays(new Date(), DEFAULT_VIEW)}
            endTime={endOfHour(new Date())}
            onRowClick={handleLabelClick}
            onCellClick={handleCellClick}
            colorCell={getHealthColor}
            tooltip={healthTooltip}
            yFormat={yFormat}
          />
          {error && <ErrorMsg>{error}</ErrorMsg>}
        </>
      }

      <br/>

      {!loading && !test && sanity && Object.keys(sanity).find(vsn => sanity[vsn].length) &&
        <>
          <h2>Sanity Tests</h2>
          <TimelineChart
            data={sanity}
            startTime={subDays(new Date(), DEFAULT_VIEW)}
            endTime={endOfHour(new Date())}
            onRowClick={handleLabelClick}
            onCellClick={handleCellClick}
            tooltip={sanityTooltip}
            yFormat={yFormat}
          />
          {error && <ErrorMsg>{error}</ErrorMsg>}
        </>
      }


      {/* by test timelines */}
      {!loading && test && testsByVSN &&
        <>
          <h2>
            {testType == 'health' ?
              <div className="flex gap">
                {test} health
                <Button
                  startIcon={<GitHubIcon />}
                  href={`${healthGithubURL}+${test.split('.').pop()}&type=code`}
                  target="_blank"
                >
                  view code
                </Button>
              </div> :
              <div className="flex gap">
                {test.split('.').pop()} sanity tests
                <Button
                  startIcon={<GitHubIcon />}
                  href={`${sanityGithubURL}+${test.split('.').pop()}&type=code`}
                  target="_blank"
                >
                  view code
                </Button>
              </div>
            }
          </h2>
          <TimelineChart
            data={testsByVSN}
            startTime={subDays(new Date(), DEFAULT_VIEW)}
            endTime={endOfHour(new Date())}
            onRowClick={handleLabelClick}
            onCellClick={handleCellClick}
            colorCell={testType == 'health' ? getHealthColor : getSanityTestColor}
            tooltip={testType == 'health' ? healthTooltip : sanityTestTooptip}
            yFormat={yFormat}
          />
        </>
      }

      <br />
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
