/* eslint-disable react/display-name */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import styled from 'styled-components'
import { useParams, Link} from 'react-router-dom'

import Alert from '@mui/material/Alert'
import Tooltip from '@material-ui/core/Tooltip'
import CheckIcon from '@mui/icons-material/CheckCircleRounded'

import {Tabs, Tab} from '../../../components/tabs/Tabs'
import Table from '../../../components/table/Table'
import Charts from '../status/charts/Charts'
import { useProgress } from '../../../components/progress/ProgressProvider'


import * as BK from '../../apis/beekeeper'
import * as BH from '../../apis/beehive'

import * as utils from '../../../components/utils/units'
import cols, { getColorClass, GoodChip } from '../status/columns'

import HealthSparkler, {healthColor, sanityColor} from '../../viz/HealthSparkler'

import { mergeMetrics } from '../status/statusDataUtils'


const SPARKLINE_START = '-12h'
const TIME_OUT = 5000


const getColumn = (id) => cols.filter(c => c.id == id)[0]

const columns = [
  {
    id: 'id',
    label: 'ID',
    width: '100px',
    format: (val) => <Link to={`/node/${val}?hours=12`}>{val}</Link>
  },
  {
    id: 'vsn',
    label: 'VSN'
  },
  getColumn('temp'),
  {
    id: 'rpi',
    label: 'RPi last updated',
    format: (_, obj) => {
      if (!obj || !obj.elaspedTimes) return '-'

      const val = obj.elaspedTimes['rpi']
      return <b className={getColorClass(val, 90000, 63000, 'success font-bold')}>
        {utils.msToTime(val)}
      </b>
    }
  }, {
    id: 'nx',
    label: 'NX last updated',
    format: (_, obj) => {
      if (!obj || !obj.elaspedTimes) return '-'

      const val = obj.elaspedTimes['nx']
      return <b className={getColorClass(val, 90000, 63000, 'success font-bold')}>
        {utils.msToTime(val)}
      </b>
    }
  }, {
    id: 'health1',
    label: 'Health',
    width: '100px',
    format: (_, row) => {
      if (!row.health) return '-'

      const {health} = row.health

      return <Link to={`/node/${row.id}`} className="no-style flex justify-center">
        {health.failed == 0 ?
          <Tooltip title={`All health tests passed`} placement="top">
            <GoodChip icon={<CheckIcon className="success" />} label="Good" />
          </Tooltip> :
          <HealthSparkler
            name="Node health"
            data={health.details}
            colorFunc={healthColor}
            width={100}
            cellW={7}
            ttPlacement="top"
          />
        }
      </Link>
    }
  }, {
    id: 'health2',
    label: 'Sanity Tests',
    width: '100px',
    format: (_, row) => {
      if (!row.health) return '-'

      const {sanity} = row.health

      return <Link to={`/node/${row.id}`} className="no-style flex justify-center">
        {sanity.failed == 0 ?
          <Tooltip title={`All sanity tests passed`} placement="top">
            <GoodChip icon={<CheckIcon className="success" />} label="Good" />
          </Tooltip> :
          <HealthSparkler
            name="Sanity tests"
            data={sanity.details}
            colorFunc={sanityColor}
            width={100}
            cellW={7}
            ttPlacement="top"
          />
        }
      </Link>
    }
  }, {
    id: 'factory1',
    label: 'Image Sign-Off',
    format: (_, row) => phaseItemSignOff(row, 'Image')
  },
  {
    id: 'factory2',
    label: 'Audio Sign-Off',
    format: (_, row) => phaseItemSignOff(row, 'Audio')
  }, {
    id: 'ip',
    label: 'IP',
    hide: true,
    format: val => val ||  '-'
  }
]


function phaseItemSignOff(row, name) {
  const obj = row.factory

  const isPhase2 = row.ip?.split('.')[2] == '12'
  const isPhase3 = row.ip?.split('.')[2] == '13'

  let column
  if (isPhase2) {
    column = `Phase 2 ${name} Sign-off`
  } else if (isPhase3) {
    column = `Phase 3 ${name} Sign-off`
  } else {
    alert(`the node ${row.id} does not seem to have an IP address!`)
  }

  if (!obj) return '-'
  if (typeof obj[column] !== 'boolean')
    return 'something is wrong!'

  return obj[column] ?
    <GoodChip icon={<CheckIcon className="success" />} label="Good" /> :
    <div className="fatal font-bold">No</div>
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
    // get latest metrics
    function ping() {
      const handle = setTimeout(async () => {
        const results = await Promise.allSettled(pingRequests())
        const [ metrics, temps, health, sanity]  = results.map(r => r.value)

        setData(mergeMetrics(dataRef.current, metrics, temps, health, sanity))
        setLastUpdate(new Date().toLocaleTimeString('en-US'))

        // recursive
        ping()
      }, TIME_OUT)

      return handle
    }

    let handle
    setLoading(true)
    const proms = [BK.getSuryaState(), ...pingRequests()]
    Promise.allSettled(proms)
      .then((results) => {
        const [state, metrics, temps, health, sanity] = results.map(r => r.value)
        setData(state)

        const allData = mergeMetrics(state, metrics, temps, health, sanity)
        setData(allData)
        setLastUpdate(new Date().toLocaleTimeString('en-US'))
        setLoading(false)
        handle = ping()
      }).catch(err => setError(err))
      .finally(() => setLoading(false))

    return () => {
      clearTimeout(handle)
    }
  }, [setLoading])


  const updateAll = useCallback(() => {
    let filteredData = data

    const phase1 = data.filter(o => o.ip?.split('.')[2] == '11')
    const phase2 = data.filter(o => o.ip?.split('.')[2] == '12')
    const phase3 = data.filter(o => o.ip?.split('.')[2] == '13')

    if (tabIdx == 0) {
      filteredData = phase1
      setCols(columns.filter(o =>
        ['id', 'vsn', 'rpi', 'nx'].includes(o.id))
      )
    } else if (tabIdx == 1) {
      filteredData = phase2
      setCols(columns)
    } else if (tabIdx == 2) {
      filteredData = phase3
      setCols(columns)
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
      {lastUpdate && <h2>Lasted updated: {lastUpdate}</h2>}
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

      {error &&
        <Alert severity="error">{error.message}</Alert>
      }
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

