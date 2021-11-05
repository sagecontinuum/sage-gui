import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import {useLocation, useHistory} from 'react-router-dom'

import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import CaretIcon from '@mui/icons-material/ExpandMoreRounded'
import UndoIcon from '@mui/icons-material/UndoRounded'
import Alert from '@mui/material/Alert'

import columns from './columns'
import Table from '../../../components/table/Table'
import FilterMenu from '../../../components/FilterMenu'
import Map from '../../../components/Map'
import Charts from './charts/Charts'
import QueryViewer from './QueryViewer'
import { useProgress } from '../../../components/progress/ProgressProvider'

import {queryData, filterData, mergeMetrics, getFilterState} from './statusDataUtils'

import * as BK from '../../apis/beekeeper'
import * as BH from '../../apis/beehive'
import * as SES from '../../apis/ses'


const TIME_OUT = 5000


const getOptions = (data: object[], field: string) : Option[] =>
  [...new Set(data.map(obj => obj[field])) ]
    .map(name => ({id: name, label: name}))



const useParams = () =>
  new URLSearchParams(useLocation().search)



type Option = {
  id: string,
  label: string
}


export default function StatusView() {
  const params = useParams()
  const history = useHistory()

  const query = params.get('query') || ''
  const status = params.get('status')
  const project = params.get('project')
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
  const [locations, setLocations] = useState<Option[]>()

  // filter state
  const [updateID, setUpdateID] = useState(0)
  const [nodeType, setNodeType] = useState<'all' | 'WSN' | 'Dell'>('all')

  const [selected, setSelected] = useState(null)
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
        const results = await Promise.allSettled([
          BH.getLatestMetrics(),
          BH.getLatestTemp(),
          SES.getLatestStatus()
        ])
        const [metrics, temps, plugins] = results.map(r => r.value)

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
    Promise.allSettled(proms)
      .then((results) => {
        const [state, metrics, temps, plugins] = results.map(r => r.value)

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
  }, [query, status, project, location, nodeType])


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
    setLocations(getOptions(data, 'location'))
  }


  const handleQuery = ({query}) => {
    if (query) params.set('query', query)
    else params.delete('query')
    history.push({search: params.toString()})
  }


  const handleFilterChange = (field: string, vals: ({id: string, label: string} | string)[]) => {
    // MUI seems to result in vals may be string or option; todo(nc): address this?
    const newStr = vals.map(item =>
      typeof item == 'string' ? item : item.id
    ).join(',')


    if (!newStr.length) params.delete(field)
    else params.set(field, newStr)

    history.push({search: params.toString()})
  }


  const handleRemoveFilters = () => {
    setNodeType('all')
    params.delete('query')
    history.push({search: ''})
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
                {/* hide this toggle (for now)
                <ToggleButtonGroup
                  value={nodeType}
                  exclusive
                  onChange={(evt, newType) => {
                    setNodeType(newType == null ? 'all' : newType)
                    handleFilterChange('nodeType', newType == 'all' || newType == null ? [] :  [{id: newType, label: newType}])
                  }}
                  aria-label="filter by node type"
                  size="small"
                >
                  <ToggleButton value="all" aria-label="all nodes">
                    All
                  </ToggleButton>
                  <ToggleButton value="wild sage" aria-label="wild sage nodes">
                    Wild Sage
                  </ToggleButton>
                  <ToggleButton value="dellblade" aria-label="blades">
                    Blades
                  </ToggleButton>
                </ToggleButtonGroup>
                */}

                {statuses ?
                  <FilterMenu
                    options={statuses}
                    value={filterState.status}
                    onChange={vals => handleFilterChange('status', vals)}
                    noSelectedSort
                    ButtonComponent={
                      <Button style={{marginLeft: 10}}>
                        Status
                        <CaretIcon />
                      </Button>
                    }
                  /> : <></>
                }
                {projects &&
                  <FilterMenu
                    options={projects}
                    value={filterState.project}
                    onChange={vals => handleFilterChange('project', vals)}
                    noSelectedSort
                    ButtonComponent={
                      <Button>
                        Project <CaretIcon />
                      </Button>
                    }
                  />
                }
                {locations &&
                  <FilterMenu
                    options={locations}
                    value={filterState.location}
                    onChange={vals => handleFilterChange('location', vals)}
                    ButtonComponent={
                      <Button>
                        Location <CaretIcon />
                      </Button>
                    }
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

      {error &&
        <Alert severity="error">{error.message}</Alert>
      }
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
`

const FilterControls = styled.div`
  margin-Left: 1em;
  margin-top: 3px;

`



