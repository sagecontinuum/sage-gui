/* eslint-disable react/display-name */
import { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import {useLocation, useNavigate} from 'react-router-dom'

import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import CaretIcon from '@mui/icons-material/ExpandMoreRounded'
import UndoIcon from '@mui/icons-material/UndoRounded'
import Alert from '@mui/material/Alert'

import columns from './columns'
import Table from '/components/table/Table'
import FilterMenu from '/components/FilterMenu'
import Map from '/components/Map'
import Charts from './charts/Charts'
import QueryViewer from '/components/QueryViewer'
import { useProgress } from '/components/progress/ProgressProvider'

import {queryData, filterData, mergeMetrics, getFilterState} from '/apps/common/statusDataUtils'

import * as BK from '/components/apis/beekeeper'
import * as BH from '/components/apis/beehive'



const SPARKLINE_START = '-12h'
const TIME_OUT = 5000


const getOptions = (data: object[], field: string) : Option[] =>
  [...new Set(data.map(obj => obj[field])) ]
    .map(name => ({id: name, label: name}))
    .filter(o => o.id?.length)


const FilterBtn = ({label}: {label: string}) =>
  <Button size="medium">{label}<CaretIcon /></Button>



const useParams = () =>
  new URLSearchParams(useLocation().search)


const pingRequests = () => [
  BH.getAdminData(),
  BH.getNodeHealth(null, SPARKLINE_START),
  BH.getNodeSanity(SPARKLINE_START)
]


type Option = {
  id: string,
  label: string
}


export default function StatusView() {
  const params = useParams()
  const navigate = useNavigate()

  const query = params.get('query') || ''
  const status = params.get('status')
  const project = params.get('project')
  const focus = params.get('focus')
  const location = params.get('location')

  // all data and current state of filtered data
  const { setLoading } = useProgress()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [filtered, setFiltered] = useState(null)
  const [filterState, setFilterState] = useState(null)

  // filter options
  const [statuses, setStatuses] = useState<Option[]>()
  const [projects, setProjects] = useState<Option[]>()
  const [focuses, setFocuses] = useState<Option[]>()
  const [locations, setLocations] = useState<Option[]>()

  // filter state
  const [updateID, setUpdateID] = useState(0)
  const [nodeType, setNodeType] = useState<'all' | 'WSN' | 'Blade'>('all')

  const [selected, setSelected] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

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
        const [ metrics, health, sanity] = results.map(r => r.value)

        setData(mergeMetrics(dataRef.current, metrics, health, sanity))
        setLastUpdate(new Date().toLocaleTimeString('en-US'))

        // recursive
        ping()
      }, TIME_OUT)
    }

    setLoading(true)
    const proms = [BK.getState(), ...pingRequests()]
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
  }, [])


  // updating on state changes
  useEffect(() => {
    if (!data) return
    updateAll(data)

    // force mapbox rerender and avoid unnecessary rerenders
    setUpdateID(prev => prev + 1)
  }, [query, status, project, focus, location, nodeType])


  // re-apply updates in case of sorting or such (remove?)
  useEffect(() => {
    if (!data) return
    updateAll(data)
  }, [data])


  // filter data (todo: this can probably be done more efficiently)
  const updateAll = (d) => {
    const filterState = getFilterState(params)
    let filteredData = queryData(d, query)
    filteredData = filterData(filteredData, filterState)

    setFiltered(filteredData)
    setFilterState(filterState)

    setStatuses(getOptions(data, 'status'))
    setProjects(getOptions(data, 'project'))
    setFocuses(getOptions(data, 'focus'))
    setLocations(getOptions(data, 'location'))
  }


  const handleQuery = ({query}) => {
    if (query) params.set('query', query)
    else params.delete('query')
    navigate({search: params.toString()}, {replace: true})
  }


  const handleFilterChange = (field: string, vals: ({id: string, label: string} | string)[]) => {
    // MUI seems to result in vals may be string or option; todo(nc): address this?
    const newStr = vals.map(item =>
      `"${typeof item == 'string' ? item : item.id}"`
    ).join(',')


    if (!newStr.length) params.delete(field)
    else params.set(field, newStr)

    navigate({search: params.toString()}, {replace: true})
  }


  const handleRemoveFilters = () => {
    setNodeType('all')
    params.delete('query')
    navigate({search: ''}, {replace: true})
  }


  const handleSelect = (sel) => {
    setSelected(sel.objs.length ? sel.objs : null)
    setUpdateID(prev => prev + 1)
  }


  return (
    <Root>
      <Overview className="flex">
        <ChartsContainer className="flex column" >
          {filtered && !selected?.length &&
            <ChartsTitle>
              {filtered.length} Node{filtered.length == 1 ? '' : 's'} | <small>{lastUpdate}</small>
            </ChartsTitle>
          }

          {selected?.length == 1 &&
            <div className="flex items-center">
              <h3>
                {selected[0].id}
              </h3>
            </div>
          }

          {selected?.length > 1 &&
            <h2>{selected.map(o => o.id).join(', ')}</h2>
          }

          {!selected?.length &&
            <Charts
              data={filtered}
              selected={selected}
              column
              //lastUpdate={lastUpdate}
            />
          }
        </ChartsContainer>

        {filtered &&
          <Map
            data={filtered}
            selected={selected}
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
            onSearch={handleQuery}
            onColumnMenuChange={() => {}}
            onSelect={handleSelect}
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
                {projects &&
                  <FilterMenu
                    label="Project"
                    options={projects}
                    value={filterState.project}
                    onChange={vals => handleFilterChange('project', vals)}
                    noSelectedSort
                  />
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
                {locations &&
                  <FilterMenu
                    label="Location"
                    options={locations}
                    value={filterState.location}
                    onChange={vals => handleFilterChange('location', vals)}
                  />
                }

                {filtered.length != data.length &&
                  <>
                    <VertDivider />
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

                <QueryViewer filterState={filterState} />
              </FilterControls>
            }
          />
        }
      </TableContainer>
    </Root>
  )
}



const VertDivider = () =>
  <Divider orientation="vertical" flexItem style={{margin: '5px 15px 5px 15px' }} />


const Root = styled.div`
`

const Overview = styled.div`
  position: sticky;
  top: 60px;
  z-index: 100;
  padding: 20px 0 10px 0;
  background: #fff;
  border-bottom: 1px solid #f2f2f2;
`

const ChartsContainer = styled.div`
  margin: 0px 20px;
  min-width: 400px;
`

const ChartsTitle = styled.h2`
  margin-top: 0;
  margin-bottom: 36px;
`


const TableContainer = styled.div`
  margin-top: .5em;
  table thead th:first-child {
    text-align: center;
  }
`

const FilterControls = styled.div`
  margin-left: 1.5em;
`



