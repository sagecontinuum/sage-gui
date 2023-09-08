/* eslint-disable react/display-name */
import { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { useSearchParams } from 'react-router-dom'

import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import UndoIcon from '@mui/icons-material/UndoRounded'

import { uniqBy } from 'lodash'

import columns from './columns'
import {
  filterData,
  getFilterState,
  mergeMetrics,
  type FilterState
} from '/components/views/statusDataUtils'

import Table from '/components/table/Table'
import FilterMenu from '/components/FilterMenu'
import Map from '/components/Map'
import QueryViewer from '/components/QueryViewer'
import { useProgress } from '/components/progress/ProgressProvider'
import { queryData } from '/components/data/queryData'

import * as BK from '/components/apis/beekeeper'
import * as BH from '/components/apis/beehive'

import settings from '/components/settings'


const TIME_OUT = 5000

const getOptions = (data: object[], field: string) : Option[] =>
  [...new Set(data.map(obj => obj[field])) ]
    .map(name => ({id: name, label: name}))
    .filter(o => o.id?.length)


// helper to filter against project/focuses in setting file
const filterOn = (data: BK.State[], key: string) =>
  data.filter(o => o[key]?.toLowerCase() == settings[key]?.toLowerCase())


function getProjectNodes() {
  return BK.getState()
    .then((data) => {
      if (settings.project)
        data = filterOn(data, 'project')
      if (settings.focus)
        data = filterOn(data, 'focus')
      if (settings.nodes)
        data = data.filter(o => settings.nodes.includes(o.vsn))

      return data
    })
}


type Option = {
  id: string,
  label: string
}

export default function Nodes() {
  const [params, setParams] = useSearchParams()

  const phase = params.get('phase') as BK.PhaseTabs

  const query = params.get('query') || ''
  const status = params.get('status')
  const focus = params.get('focus')
  const city = params.get('city')
  const state = params.get('state')
  const sensor = params.get('sensor')

  // all data and current state of filtered data
  const { setLoading } = useProgress()
  const [data, setData] = useState<BK.State[]>(null)
  const [error, setError] = useState(null)
  const [filtered, setFiltered] = useState<BK.State[]>(null)
  const [filterState, setFilterState] = useState<FilterState>({})

  // filter options
  const [statuses, setStatuses] = useState<Option[]>()
  const [focuses, setFocuses] = useState<Option[]>()
  const [cities, setCities] = useState<Option[]>()
  const [states, setStates] = useState<Option[]>()
  const [sensors, setSensors] = useState<Option[]>()

  // filter state
  const [updateID, setUpdateID] = useState(0)
  const [nodeType, setNodeType] = useState<'all' | 'WSN' | 'Blade'>('all')

  const [selected, setSelected] = useState<BK.State[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date>(null)

  const dataRef = useRef(null)
  dataRef.current = data


  // load data
  useEffect(() => {
    let done = false
    let handle

    // get latest metrics
    function ping() {
      handle = setTimeout(async () => {
        if (done) return
        const metrics = await BH.getNodeData()

        setData(mergeMetrics(dataRef.current, metrics, null, null))
        setLastUpdate(new Date())

        // recursive
        ping()
      }, TIME_OUT)
    }

    setLoading(true)
    const proms = [getProjectNodes(), BH.getNodeData()]
    Promise.all(proms)
      .then(([state, metrics]) => {
        if (done) return

        setData(state)

        const allData = mergeMetrics(state, metrics, null, null)
        setData(allData)
        setLastUpdate(new Date())
        ping()
      }).catch(err => {console.log('err', err) ; setError(err)})
      .finally(() => setLoading(false))

    return () => {
      done = true
      clearTimeout(handle)
    }
  }, [])


  // updating on state changes
  useEffect(() => {
    if (!data) return
    updateAll(data, phase)

    // force mapbox rerender and avoid unnecessary rerenders
    setUpdateID(prev => prev + 1)
  }, [query, status, focus, city, state, sensor, nodeType, phase])


  // re-apply updates in case of sorting or such (remove?)
  useEffect(() => {
    if (!data) return
    updateAll(data, phase)
  }, [data, phase])


  // filter data (todo: this can probably be done more efficiently)
  const updateAll = (d, phase) => {
    const filterState = getFilterState(params)
    setFilterState(filterState)

    let filteredData = d
    if (phase)
      filteredData = d.filter(obj => obj.node_phase_v3 == BK.phaseMap[phase])

    filteredData = queryData(filteredData, query)
    filteredData = filterData(filteredData, filterState)
    setFiltered(filteredData)

    setStatuses(getOptions(data, 'status'))
    setFocuses(getOptions(data, 'focus'))
    setCities(getOptions(data, 'city'))
    setStates(getOptions(data, 'state'))

    const sensorOptions = uniqBy(data.flatMap(o => o.sensors), 'hw_model')
      .map(o => ({id: o.hw_model, label: o.hw_model}))

    setSensors(sensorOptions)
  }


  const handleQuery = ({query}) => {
    if (query) params.set('query', query)
    else params.delete('query')
    setParams(params, {replace: true})
  }


  const handleFilterChange = (field: string, vals: ({id: string, label: string} | string)[]) => {
    // MUI seems to result in vals may be string or option; todo(nc): address this?
    const newStr = vals.map(item =>
      `"${typeof item == 'string' ? item : item.id}"`
    ).join(',')


    if (!newStr.length) params.delete(field)
    else params.set(field, newStr)
    setParams(params, {replace: true})
  }


  const handleRemoveFilters = () => {
    setNodeType('all')
    setParams(phase ? {phase} : {}, {replace: true})
  }


  const handleSelect = (sel) => {
    setSelected(sel.objs.length ? sel.objs : [])
    setUpdateID(prev => prev + 1)
  }


  const getSubset = (selected, nodes) => {
    const vsns = selected.map(o => o.vsn)
    const subset = nodes.filter(obj => vsns.includes(obj.vsn))
    return subset
  }


  const handleQueryViewerChange = (field: string, next: string[]) => {
    if (!next.length) params.delete(field)
    else params.set(field, next.join(','))
    setParams(params, {replace: true})
  }


  return (
    <Root>
      <Overview className="flex">
        {filtered && !selected?.length &&
          <Title>
            {filtered.length} Node{filtered.length == 1 ? '' : 's'} | <small>
              {lastUpdate?.toLocaleTimeString('en-US')}
            </small>
          </Title>
        }

        {filtered &&
          <Map
            data={selected.length ? getSubset(selected, filtered) : filtered}
            updateID={updateID}
          />
        }
      </Overview>

      {error &&
        <Alert severity="error">{error.message}</Alert>
      }

      <TableContainer>
        {filtered &&
          <Table
            primaryKey="id"
            rows={filtered}
            columns={columns}
            enableSorting
            sort='-vsn'
            onSearch={handleQuery}
            onColumnMenuChange={() => {}}
            onSelect={handleSelect}
            emptyNotice="No nodes found"
            middleComponent={
              <FilterControls className="flex items-center">
                {statuses ?
                  <FilterMenu
                    label="Status"
                    options={statuses}
                    value={filterState.status}
                    onChange={vals => handleFilterChange('status', vals)}
                    noSelectedSort
                  /> : <></>
                }
                {focuses &&
                  <FilterMenu
                    label="Focus"
                    options={focuses}
                    value={filterState.focus}
                    onChange={vals => handleFilterChange('focus', vals)}
                    noSelectedSort
                  />
                }
                {cities &&
                  <FilterMenu
                    label="City"
                    options={cities}
                    value={filterState.city}
                    onChange={vals => handleFilterChange('city', vals)}
                  />
                }
                {states &&
                  <FilterMenu
                    label="State"
                    options={states}
                    value={filterState.state}
                    onChange={vals => handleFilterChange('state', vals)}
                  />
                }
                {sensors &&
                  <FilterMenu
                    label="Sensors"
                    options={sensors}
                    value={filterState.sensor}
                    onChange={vals => handleFilterChange('sensor', vals)}
                  />
                }

                {Object.values(filterState).reduce((acc, fList) => acc + fList.length, 0) as number > 0 &&
                  <>
                    <Divider orientation="vertical" flexItem style={{margin: '5px 15px 5px 15px' }} />
                    <Button variant="contained"
                      color="primary"
                      size="small"
                      onClick={handleRemoveFilters}
                      style={{backgroundColor: '#1c8cc9'}}
                      startIcon={<UndoIcon />}
                    >
                      Clear
                    </Button>
                  </>
                }

                <QueryViewer
                  filterState={filterState}
                  onDelete={handleQueryViewerChange}
                />
              </FilterControls>
            }
          />
        }
      </TableContainer>
    </Root>
  )
}


const Root = styled.div`
`

const Overview = styled.div`
  z-index: 100;
  padding: 10px 0;
  background: #fff;
  border-bottom: 1px solid #f2f2f2;
`

const Title = styled.h2`
  margin: .5em;
  position: absolute;
  z-index: 1000;
`

const TableContainer = styled.div`
  margin-top: .5em;

  .status-icon {
    margin: 0 10px;
  }
`

const FilterControls = styled.div`
  margin-left: 1.5em;
`



