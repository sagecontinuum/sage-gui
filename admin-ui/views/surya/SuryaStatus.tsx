/* eslint-disable react/display-name */
import { useState, useEffect, useRef, useCallback } from 'react'
import styled from 'styled-components'
import { useParams, Link} from 'react-router-dom'

import Alert from '@mui/material/Alert'
import Tooltip from '@material-ui/core/Tooltip'
import CheckIcon from '@mui/icons-material/CheckCircleRounded'

import {Tabs, Tab} from '~/components/tabs/Tabs'
import Table from '~/components/table/Table'
import Charts from '../status/charts/Charts'
import { useProgress } from '~/components/progress/ProgressProvider'


import * as BK from '~/components/apis/beekeeper'
import * as BH from '~/components/apis/beehive'

import * as utils from '~/components/utils/units'
import cols, { getColorClass, GoodChip } from '../status/columns'

import HealthSparkler, {healthColor, sanityColor} from '../../viz/HealthSparkler'

import { mergeMetrics } from '../status/statusDataUtils'

import config from '../../../config'
const FAIL_THRES = config.admin.elapsedThresholds.fail
const WARNING_THRES = config.admin.elapsedThresholds.warning
const SPARKLINE_START = '-7d'
const TIME_OUT = 5000


const getColumn = (id) => cols.find(c => c.id == id)

const columns = [
  {
    id: 'id',
    label: 'ID',
    width: '100px',
    format: (val) => <Link to={`/node/${val}?factory=true`}>{val}</Link>
  },
  {
    id: 'vsn',
    label: 'VSN'
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

      const {failed, passed, details} = row.health.health

      const isPhase2 = inPhaseN(2, row.ip)
      const lastN = isPhase2 ? 12 : 7*24
      const data = details?.slice(-lastN)

      return <Link to={`/node/${row.id}?factory=true`} className="no-style flex justify-center">
        {(failed + passed) == 0 ? <div>no data</div> :
          (failed == 0 ?
            <Tooltip title={<>All health tests passed<br/>for last {details?.length} hours!</>} placement="top">
              <GoodChip icon={<CheckIcon className="success" />} label="Good" />
            </Tooltip> :
            <HealthSparkler
              name={<>summary of last (available) {data?.length} hours</>}
              data={data}
              colorFunc={healthColor}
              cellW={isPhase2 ? 7 : 2}
              cellPad={isPhase2 ? 1 : 0}
              ttPlacement="top"
            />
          )}
      </Link>
    }
  }, {
    id: 'health2',
    label: 'Sanity Tests',
    format: (_, row) => {
      if (!row.health) return '-'

      const {failed, passed, details} = row.health.sanity

      const isPhase2 = inPhaseN(2, row.ip)
      const lastN = isPhase2 ? 12 : 7*24
      const data = details?.slice(-lastN)

      return <Link to={`/node/${row.id}?factory=true`} className="no-style flex justify-center">
        {(failed + passed) == 0 ? <div>no data</div> :
          (failed == 0 ?
            <Tooltip title={<>All sanity tests passed<br/>for last {details?.length} hours!</>} placement="top">
              <GoodChip icon={<CheckIcon className="success" />} label="Good" />
            </Tooltip> :
            <HealthSparkler
              name={<>summary of last (available) {data?.length} hours</>}
              data={data}
              colorFunc={sanityColor}
              cellW={isPhase2 ? 7 : 2}
              cellPad={isPhase2 ? 1 : 0}
              ttPlacement="top"
            />)
        }
      </Link>
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



const pingRequests = () => [
  BH.getLatestMetrics(),
  BH.getLatestTemp(),
  BH.getNodeHealth(null, SPARKLINE_START),
  BH.getNodeSanity(SPARKLINE_START)
]


export default function StatusView() {
  const {phase} = useParams()

  const view = Number((phase || '1').slice(-1)) - 1  // covert to tab index

  // all data and current state of filtered data
  const { setLoading } = useProgress()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [filtered, setFiltered] = useState(null)

  const [byPhase, setByPhase] = useState({phase1: null, phase2: null, phase3: null})
  const [cols, setCols] = useState(columns)

  const [lastUpdate, setLastUpdate] = useState(null)

  const [tabIdx, setTabIdx] = useState(view || 0)

  const dataRef = useRef(null)
  dataRef.current = data


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
        const [ metrics, temps, health, sanity]  = results.map(r => r.value)

        setData(mergeMetrics(dataRef.current, metrics, temps, health, sanity))
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
        const [state, metrics, temps, health, sanity] = results.map(r => r.value)
        setData(state)

        const allData = mergeMetrics(state, metrics, temps, health, sanity)
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
    const phase3 = data.filter(o => inPhaseN(3, o.ip))

    if (tabIdx == 0) {
      filteredData = phase1
      setCols(columns.filter(colObj =>
        ['id', 'vsn', 'nx'].includes(colObj.id))
      )
    } else if (tabIdx == 1) {
      filteredData = phase2
      setCols([...columns, phase2SignOff])
    } else if (tabIdx == 2) {
      filteredData = phase3
      setCols([...columns, finalSignOff])
    }

    setByPhase({phase1, phase2, phase3})
    setFiltered(filteredData)
  }, [data, tabIdx])


  // updating on state changes
  useEffect(() => {
    if (!data) return
    updateAll()
  }, [data, updateAll])


  const getCountIndicator = (phase: string) =>
    byPhase[phase] ? `(${byPhase[phase].length})` : ''



  return (
    <Root>
      {lastUpdate && <h2>Last update: {lastUpdate}</h2>}

      {error &&
        <Alert severity="error">{error.message}</Alert>
      }

      <Tabs
        value={tabIdx}
        onChange={(_, idx) => setTabIdx(idx)}
        aria-label="Build phase tabs"
      >
        <Tab label={`NX flash ${getCountIndicator('phase1')}`} idx={0} component={Link} to="/surya/phase1" />
        <Tab label={`Open build ${getCountIndicator('phase2')}`} idx={1} component={Link} to="/surya/phase2" />
        <Tab label={`Long soak ${getCountIndicator('phase3')}`} idx={2} component={Link} to="/surya/phase3" />
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
            emptyNotice={`No nodes found in phase ${tabIdx+1}`}
          />
        }
      </TableContainer>

    </Root>
  )
}

const Root = styled.div`

  .MuiTabs-indicator {
    transition: none;
  }

`

const Overview = styled.div`
  margin: 30px 10px;

  .summary-bar {
    margin: 0 20px 0 0;
    align-self: center;
  }
`

const TableContainer = styled.div`
  table {
    th:nth-child(n+6):nth-child(n+3),
    td:nth-child(n+6):nth-child(n+3) {
      text-align: center; // center for viz / signoffs
    }
  }
`

