/* eslint-disable react/display-name */
import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import {useLocation } from 'react-router-dom'

import Divider from '@material-ui/core/Divider'
import Alert from '@material-ui/lab/Alert'

import Table from '../../../components/table/Table'
import Charts from '../status/charts/Charts'
import { useProgress } from '../../../components/progress/ProgressProvider'


import * as BK from '../../apis/beekeeper'
import * as BH from '../../apis/beehive'
import * as SES from '../../apis/ses'

import * as utils from '../../../components/utils/units'
import columns, { getColorClass } from '../status/columns'

import { mergeMetrics } from '../status/Status'


const TIME_OUT = 5000
const PRIMARY_KEY = 'id'




// simplify dashboard by including a subset of column
const ignoreColumns = [
  'kind', 'project', 'location', 'data', 'uptimes', 'memTotal', 'fsSize'
]
let cols = columns.filter(col => !ignoreColumns.includes(col.id))

// replace last updated
cols = cols.filter(col => col.id != 'elaspedTimes')
cols.push({
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
})




function queryData(data: object[], query: string) {
  return data.filter(row =>
    Object.values(row)
      .join('').toLowerCase()
      .includes(query.toLowerCase())
  )
}


function filterData(data: object[], state: object) {
  const filteredRows = data.filter(row => {

    let keep = true
    for (const [field, filters] of Object.entries(state)) {
      if (!filters.length) continue

      if (!filters.includes(row[field])) {
        keep = false
        break
      }
    }

    return keep
  })

  return filteredRows
}



const useParams = () =>
  new URLSearchParams(useLocation().search)


const initialState = {
  status: [],
  project: [],
  location: []
}

function getFilterState(params) {
  let init = {...initialState}
  for (const [key, val] of params) {
    if (['query', 'details'].includes(key)) continue
    init[key] = val.split(',')
  }

  return init
}


export default function StatusView() {
  const params = useParams()

  const query = params.get('query') || ''
  const status = params.get('status')
  const project = params.get('project')
  const location = params.get('location')

  // all data and current state of filtered data
  const { setLoading } = useProgress()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [filtered, setFiltered] = useState(null)

  // selected
  const [selected, setSelected] = useState(null)

  // ticker of recent activity
  // const [loadingTicker, setLoadingTicker] = useState(false)
  const [activity, setActivity] = useState(null)

  const [lastUpdate, setLastUpdate] = useState(null)

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
  }, [])


  // updating on state changes
  useEffect(() => {
    if (!data) return
    updateAll(data)

    // force mapbox rerender and avoid unnecessary rerenders
    setUpdateID(prev => prev + 1)
  }, [query, status, project, location])


  // re-apply updates in case of sorting or such (remove?)
  useEffect(() => {
    if (!data) return
    updateAll(data)
  }, [data])


  // activity updates
  useEffect(() => {
    if (selected?.length !== 1) {
      setActivity(null)
      return
    }
  }, [selected])


  // filter data (todo: this can probably be done more efficiently)
  const updateAll = (d) => {
    const filterState = getFilterState(params)
    let filteredData = queryData(d, query)
    filteredData = filterData(filteredData, filterState)

    setFiltered(filteredData)
  }


  const handleSelect = (sel) => {
    setSelected(sel.objs.length ? sel.objs : null)
  }


  return (
    <Root>
      <Overview className="flex">
        <ChartsContainer className="flex" >
          {selected?.length == 1 &&
            <div className="flex items-center">
              <h3>
                {selected[0].id}
              </h3>
            </div>
          }

          <Charts
            data={filtered}
            selected={selected}
            activity={activity}
            lastUpdate={lastUpdate}
          />
        </ChartsContainer>
      </Overview>

      <TableContainer>
        {filtered &&
          <Table
            primaryKey={PRIMARY_KEY}
            rows={filtered}
            columns={cols}
            enableSorting
            // onSearch={handleQuery}
            // onColumnMenuChange={() => {}}
            onSelect={handleSelect}
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

  top: 60px;
  z-index: 100;
  padding: 20px 0 10px 0;
  background: #fff;
  border-bottom: 1px solid #f2f2f2;
`

const ChartsContainer = styled.div`
  margin: 0px 20px;
`


const TableContainer = styled.div`
`

