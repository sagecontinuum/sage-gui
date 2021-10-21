/* eslint-disable react/display-name */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import styled from 'styled-components'
import {useLocation } from 'react-router-dom'

import Alert from '@mui/material/Alert'

import {Tabs, Tab} from '../../../components/tabs/Tabs'
import Table from '../../../components/table/Table'
import Charts from '../status/charts/Charts'
import { useProgress } from '../../../components/progress/ProgressProvider'


import * as BK from '../../apis/beekeeper'
import * as BH from '../../apis/beehive'
import * as SES from '../../apis/ses'

import * as utils from '../../../components/utils/units'
import columns, { getColorClass } from '../status/columns'

import {queryData, filterData, mergeMetrics, getFilterState} from '../status/statusDataUtils'


const TIME_OUT = 5000

// ignore some columns to simplify table
const ignoreColumns = [
  'kind', 'project', 'elaspedTimes',  'location', 'data',
  'uptimes', 'memTotal', 'fsSize', 'temp'
]
const cols = columns.filter(col => !ignoreColumns.includes(col.id))

const simpleColumns = [
  ...cols,
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
    id: 'ip',
    label: 'IP',
    hide: false,
    format: val => val ||  '-'
  }
]



const useParams = () =>
  new URLSearchParams(useLocation().search)



export default function StatusView() {
  const params = useParams()

  const view = Number((params.get('view') || '1').slice(-1)) - 1  // covert to tab index
  const query = params.get('query') || ''

  // all data and current state of filtered data
  const { setLoading } = useProgress()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [filtered, setFiltered] = useState(null)

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
        const [metrics, temps, plugins] = await Promise.all([
          BH.getLatestMetrics(),
          BH.getLatestTemp(),
          SES.getLatestStatus()
        ])

        setData(mergeMetrics(dataRef.current, metrics, temps, plugins))
        setLastUpdate(new Date().toLocaleTimeString('en-US'))

        // recursive
        ping()
      }, TIME_OUT)

      return handle
    }

    let handle
    setLoading(true)
    const proms = [
      BK.fetchState(),
      BH.getLatestMetrics(),
      BH.getLatestTemp(),
      SES.getLatestStatus()
    ]
    Promise.all(proms)
      .then(([state, metrics, temps, plugins]) => {
        setData(state)

        const allData = mergeMetrics(state, metrics, temps, plugins)
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
    const filterState = getFilterState(params)
    let filteredData = queryData(data, query)
    filteredData = filterData(filteredData, filterState)

    if (tabIdx == 0) {
      filteredData = data.filter(o => o.ip?.split('.')[2] == '11')
    } else if (tabIdx == 1) {
      filteredData = data.filter(o => o.ip?.split('.')[2] == '12')
    } else if (tabIdx == 2) {
      filteredData = data.filter(o => o.ip?.split('.')[2] == '13')
    }

    setFiltered(filteredData)
  }, [data, tabIdx, query])


  // updating on state changes
  useEffect(() => {
    if (!data) return
    updateAll()
  }, [data, tabIdx, updateAll])




  return (
    <Root>
      <br/>
      <Tabs
        value={tabIdx}
        onChange={(_, idx) => setTabIdx(idx)}
        aria-label="Build phase tabs"
      >
        <Tab label="Phase 1" idx={0} />
        <Tab label="Phase 2" idx={1} />
        <Tab label="Phase 3" idx={2} />
      </Tabs>

      <Overview>
        <Charts data={filtered} />
      </Overview>


      <TableContainer>
        {filtered &&
          <Table
            primaryKey="id"
            rows={filtered}
            columns={simpleColumns}
            enableSorting
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

`

const Overview = styled.div`
  margin: 30px 10px;

  .summary-bar {
    margin: 0 20px 0 0;
    align-self: center;
  }
`

const TableContainer = styled.div`
`

