/* eslint-disable react/display-name */
import { useState, useEffect, useRef, useCallback } from 'react'
import styled from 'styled-components'
import { useParams, Link} from 'react-router-dom'

import Alert from '@mui/material/Alert'
import CheckIcon from '@mui/icons-material/CheckCircleRounded'

import {Tabs, Tab} from '/components/tabs/Tabs'
import Table from '/components/table/Table'
import Charts from '../status/charts/Charts'
import { useProgress } from '/components/progress/ProgressProvider'

import * as BK from '/components/apis/beekeeper'
import * as BH from '/components/apis/beehive'
import * as utils from '/components/utils/units'
import HealthSparkler, {healthColor, sanityColor} from '/components/viz/HealthSparkler'
import { getColorClass } from '/components/utils/NodeLastReported'
import cols, { GoodChip } from '../status/columns'

import { mergeMetrics } from '/components/views/statusDataUtils'

import settings from '/apps/admin/settings'
const FAIL_THRES = settings.elapsedThresholds.fail
const WARNING_THRES = settings.elapsedThresholds.warning
const SPARKLINE_START = '-7d'
const TIME_OUT = 5000


const getColumn = (id) => cols.find(c => c.id == id)

const columns = [
  {
    id: 'id',
    label: 'ID',
    width: '100px'
  },
  {
    id: 'vsn',
    label: 'VSN',
    format: (val) => <Link to={`/node/${val}?factory=true`}>{val}</Link>
  },
  getColumn('temp'),
  {
    id: 'uptimes',
    label: 'Uptime',
    format: (val) =>
      !val ? '-' : utils.prettyTime(val.nx)
  }, {
    id: 'rpi',
    label: 'RPi last updated',
    format: (_, obj) => {
      if (!obj || !obj.elapsedTimes) return '-'

      if (!obj.shield)
        return <span className="muted">no shield</span>

      const val = obj.elapsedTimes['rpi']
      return <b className={getColorClass(val, FAIL_THRES, WARNING_THRES, 'success font-bold')}>
        {utils.msToTime(val)}
      </b>
    }
  }, {
    id: 'nx',
    label: 'NX last updated',
    format: (_, obj) => {
      if (!obj || !obj.elapsedTimes) return '-'

      const val = obj.elapsedTimes['nx']
      return <b className={getColorClass(val, FAIL_THRES, WARNING_THRES,'success font-bold')}>
        {utils.msToTime(val)}
      </b>
    }
  }, {
    id: 'health1',
    label: 'Health',
    format: (_, row) => {
      if (!row.health) return '-'

      const {details} = row.health.health

      const isPhase2 = inPhaseN(2, row.ip)
      const lastN = isPhase2 ? 3*24 : 7*24
      const data = details?.slice(-lastN)

      return <Link to={`/node/${row.id}?factory=true`} className="no-style flex justify-end">
        {!data?.length ? <div>no data</div> :
          <HealthSparkler
            name={<>summary of last (available) {data?.length} hours</>}
            data={data}
            colorFunc={healthColor}
            cellW={isPhase2 ? 2 : 2}
            cellPad={isPhase2 ? 1 : 0}
            ttPlacement="top"
          />
        }
      </Link>
    }
  }, {
    id: 'health2',
    label: 'Sanity Tests',
    format: (_, row) => {
      if (!row.health) return '-'

      const {details} = row.health.sanity

      const isPhase2 = inPhaseN(2, row.ip)
      const lastN = isPhase2 ? 3*24 : 7*24
      const data = details?.slice(-lastN)

      return <Link to={`/node/${row.id}?factory=true`} className="no-style flex justify-end">
        {!data?.length ? <div>no data</div> :
          <HealthSparkler
            name={<>summary of last (available) {data?.length} hours</>}
            data={data}
            colorFunc={sanityColor}
            cellW={isPhase2 ? 2 : 2}
            cellPad={isPhase2 ? 1 : 0}
            ttPlacement="top"
          />
        }
      </Link>
    }
  }, {
    id: 'Note',
    label: 'Note',
    format: (_, row) => {
      if (!row.factory) return <></>

      const phase = getPhase(row.ip)
      const note = row.factory[`Phase ${phase} Note`]
      return <div className="text-left">{note?.length > 0 ? note : '-'}</div>
    }
  }, {
    id: 'factory1',
    label: 'Image Sign-off',
    format: (_, row) => {
      const phase = getPhase(row.ip)
      return phaseItemSignOff(row, `Phase ${phase} Image Sign-off`)
    }
  }, {
    id: 'factory2',
    label: 'Audio Sign-off',
    format: (_, row) => {
      const phase = getPhase(row.ip)
      return phaseItemSignOff(row, `Phase ${phase} Audio Sign-off`)
    }
  }, {
    id: 'ip',
    label: 'IP',
    hide: true,
    format: val => val ||  '-'
  }
]


const phase2SignOff = {
  id: 'phase2Sign',
  label: 'Phase 2 Sign-off',
  format: (_, row) => phaseItemSignOff(row, `Phase 2 Sign-off`)
}

const finalSignOff = {
  id: 'finalSign',
  label: 'Final Sign-Off',
  format: (_, row) => phaseItemSignOff(row, `Final Sign-off`)
}



function phaseItemSignOff(row, name) {
  const obj = row.factory

  if (!obj) return '-'
  if (typeof obj[name] !== 'boolean')
    return 'something is wrong!'

  return obj[name] ?
    <GoodChip icon={<CheckIcon className="success" />} label="Good" /> :
    <div className="fatal font-bold">No</div>
}



const inPhaseN = (n, ip) =>
  ip?.split('.')[2] == `1${n}`


function getPhase(ip: string) {
  const part =  ip?.split('.')[2]

  if (part == '11') return 1
  else if (part == '12') return 2
  else if (part == '13') return 3

  alert(`${ip} is an invalid IP address!`)
}


const getTabIdx = (phase: string) =>
  Number((phase || '1').slice(-1)) - 1


const pingRequests = () => [
  BH.getFactoryData(),
  BH.getHealthData({start: SPARKLINE_START}),
  BH.getSanitySummary({start: SPARKLINE_START})
]


export default function StatusView() {
  const {phase} = useParams()

  // all data and current state of filtered data
  const { setLoading } = useProgress()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [filtered, setFiltered] = useState(null)

  const [byPhase, setByPhase] = useState({phase1: null, phase2: null, phase3: null, phase4: null})
  const [cols, setCols] = useState(columns)

  const [lastUpdate, setLastUpdate] = useState(null)

  // covert phaseX to tab index
  const [tabIdx, setTabIdx] = useState<number>(getTabIdx(phase))
  const [noMoreConfetti, setNoMoreConfetti] = useState(false)

  const confettiRef = useRef()
  const dataRef = useRef(null)
  dataRef.current = data

  useEffect(() => {
    setTabIdx(getTabIdx(phase))
  }, [phase])

  /**
   * load data
   */
  useEffect(() => {
    let done = false
    let handle

    // get latest metrics
    function ping() {
      handle = setTimeout(async () => {
        if (done) return
        const results = await Promise.allSettled(pingRequests())
        const [ metrics, health, sanity]  = results.map(r => r.value)

        setData(mergeMetrics(dataRef.current, metrics, health, sanity))
        setLastUpdate(new Date().toLocaleTimeString('en-US'))

        // recursive
        ping()
      }, TIME_OUT)
    }

    setLoading(true)
    const proms = [BK.getSuryaState(), ...pingRequests()]
    Promise.allSettled(proms)
      .then((results) => {
        if (done) return
        const [state, metrics, health, sanity] = results.map(r => r.value)
        setData(state)

        const allData = mergeMetrics(state, metrics, health, sanity)
        setData(allData)
        setLastUpdate(new Date().toLocaleTimeString('en-US'))
        setLoading(false)
        ping()
      }).catch(err => setError(err))
      .finally(() => setLoading(false))

    return () => {
      done = true
      clearTimeout(handle)
    }
  }, [setLoading])


  const updateAll = useCallback(() => {
    let filteredData = data

    const phase1 = data.filter(o => inPhaseN(1, o.ip))
    const phase2 = data.filter(o => inPhaseN(2, o.ip))
    const phase3 = data.filter(o => inPhaseN(3, o.ip) && (!o.factory || !o.factory['Final Sign-off']))
    const phase4 = data.filter(o => o.factory && o.factory['Final Sign-off'])

    if (tabIdx == 0) {
      filteredData = phase1
      setCols(columns.filter(colObj =>
        ['id', 'vsn', 'nx'].includes(colObj.id)
      ))
    } else if (tabIdx == 1) {
      filteredData = phase2
      setCols([...columns, phase2SignOff])
    } else if (tabIdx == 2) {
      filteredData = phase3
      setCols([...columns, finalSignOff])
    } else if (tabIdx == 3) {
      filteredData = phase4
      setCols([
        ...columns.filter(colObj => ['id', 'vsn'].includes(colObj.id)),
        getColumn('project'),
        getColumn('focus'),
        {...getColumn('location'), hide: false},
        finalSignOff
      ])
    }

    setByPhase({phase1, phase2, phase3, phase4})
    setFiltered(filteredData)
  }, [data, tabIdx])


  // updating on state changes
  useEffect(() => {
    if (!data) return
    updateAll()
  }, [data, updateAll])

  useEffect(() => {
    if (tabIdx == 3 && !noMoreConfetti) {
      const cfetti = confetti.create(confettiRef.current, {
        resize: true,
        useWorker: true
      })

      cfetti({
        angle: 60,
        spread: 55,
        particleCount: 100,
        origin: { x: 0 },
        disableForReducedMotion: true
      })

      cfetti({
        angle: 120,
        spread: 55,
        particleCount: 100,
        origin: { x: 1 },
        disableForReducedMotion: true
      })

      setNoMoreConfetti(true)
    }
  }, [tabIdx])


  const getCountIndicator = (phase: string) =>
    byPhase[phase] ? `(${byPhase[phase].length})` : ''


  return (
    <Root>
      <canvas ref={confettiRef}></canvas>

      {lastUpdate && <h2>Last update: {lastUpdate}</h2>}

      {error &&
        <Alert severity="error">{error.message}</Alert>
      }

      <Tabs
        value={tabIdx}
        onChange={(_, idx) => setTabIdx(idx)}
        aria-label="Build phase tabs"
      >
        <Tab label={`NX flash ${getCountIndicator('phase1')}`} component={Link} to="/surya/phase1" />
        <Tab label={`Open build ${getCountIndicator('phase2')}`} component={Link} to="/surya/phase2" />
        <Tab label={`Long soak ${getCountIndicator('phase3')}`} component={Link} to="/surya/phase3" />
        <Tab label={`Completed ${getCountIndicator('phase4')}`} component={Link} to="/surya/phase4" className="completed-tab" />
      </Tabs>


      {['phase2', 'phase3'].includes(phase) && byPhase[phase]?.length > 0 &&
        <Overview>
          <Charts data={filtered} charts={null} />
        </Overview>
      }

      <TableContainer>
        {filtered &&
          <Table
            primaryKey="id"
            rows={filtered}
            columns={cols}
            enableSorting
            sort={'+vsn'}
            emptyNotice={`No nodes found in phase ${tabIdx+1}`}
          />
        }
      </TableContainer>
    </Root>
  )
}

const Root = styled.div`
  margin: 0 10px 10px 10px;

  .MuiTabs-indicator {
    transition: none;
  }

  .completed-tab {
    margin-left: auto;
  }

  canvas {
    position: absolute;
    width: 100%;
    z-index: 9999;
    pointer-events: none;
  }
`

const Overview = styled.div`
  margin: 20px 10px 0 10px;

  .summary-bar {
    margin: 0 20px 0 0;
    align-self: center;
  }
`

const TableContainer = styled.div`
  table {
    th:nth-child(n+7):not(:nth-child(9)),
    td:nth-child(n+7):not(:nth-child(9)) {
      text-align: center; // center for viz / signoffs
    }
  }

  .MuiChip-root {
    cursor: initial;
  }
`

