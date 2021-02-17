import React, { useState, useEffect, useReducer } from 'react'
import styled from 'styled-components'

import Button from '@material-ui/core/Button'

import columns from './columns'
import Table from '../../../components/table/Table'
import Filter from '../../../components/Filter'
import Map from '../../../components/Map'
import Overview from './Overview'

import config from '../../config'
import DetailsSidebar from './DetailsSidebar'

const url = config.beekeeper

const ENABLE_MAP = true
const TIME_OUT = 2000

const MOCK_DOWN_NODE = 'Sage-NEON-04'
const PRIMARY_KEY = 'name'


type Row = {
  [key: string]: any
}

type Data = Row[]



const randomTime = () => Math.floor(Math.random() * 12) + 1
const randomMetric = () => (Math.random() * 100).toFixed(2)
const randomMem = () => (Math.random() * 192).toFixed(2)

const mockData = (data: Data) => {
  return data.map(obj => {
    const {name, location, status} = obj

    return {
      ...obj,
      id: name,
      status: name == MOCK_DOWN_NODE ? 'failed' : (status == 'Up' ? 'active' : 'inactive'),
      region: location.slice(location.indexOf(',') + 1),
      project: name.slice(name.indexOf('-') + 1, name.lastIndexOf('-')),
      lastUpdated: randomTime(),
      mem: randomMem(),
      cpu: randomMetric(),
      storage: randomMetric()
    }
  })
}


const mockUpdate = (data: any[]) => {
  return data.map((obj, i) => {
    return {
      ...obj,
      lastUpdated: obj.name == MOCK_DOWN_NODE ? 'N/A' : (obj.lastUpdated + TIME_OUT / 1000) % 16,
      mem: obj.mem % 4 == 0 ? randomMem() : obj.mem,
      cpu: randomMetric(),
      storage: obj.lastUpdated % 5 == 0 ? randomMetric(): obj.storage
    }
  })
}



const queryData = (data: object[], query: string) => {
  return data.filter(row =>
    Object.values(row)
      .join('').toLowerCase()
      .includes(query.toLowerCase())
  )
}



const filterData = (data: object[], state: object) => {
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



const getOptions = (data: object[], field: string) =>
  [...new Set(data.map(obj => obj[field])) ]
    .map(name => ({id: name, label: name}))



const initialState = {
  status: [],
  project: [],
  region: []
}

const filterReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FILTER':
      return {...state, [action.field]: [action.val]}
    case 'ADD_FILTER':
      return {...state, [action.field]: [...state[action.field], action.val]}
    case 'RM_FILTER':
      return {...state, [action.field]: state[action.field].filter(val => val != action.val) }
    case 'CLEAR_FILTER':
      return {...state, [action.field]: []}
    case 'CLEAR_ALL':
      return initialState
    default:
      throw new Error('Invalid filter reducer action')
  }
}

type Option = {
  id: string,
  label: string
}

function StatusView() {
  const [data, setData] = useState(null)
  const [filtered, setFiltered] = useState(null)

  const [query, setQuery] = useState('')

  // filter options
  const [statuses, setStatuses] = useState<Option[]>()
  const [projects, setProjects] = useState<Option[]>()
  const [regions, setRegions] = useState<Option[]>()

  // filter state
  const [filterState, dispatch] = useReducer(filterReducer, initialState)
  const [updateID, setUpdateID] = useState(0)

  // selected
  const [selected, setSelected] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  // load data
  useEffect(() => {
    let handle

    (async () => {
      const res = await fetch(`${url}/blades.json`)
      const data = await res.json()

      const rows = mockData(data)
      setData(rows)
      updateAll(rows)
      handle = mockPings(rows)
    })()

    return () => {
      clearTimeout(handle)
    }
  }, [])


  // effect for local state change
  useEffect(() => {
    if (!data) return
    updateAll(data)
  }, [query, filterState, data])


  // this will be handled via polling or websockets
  const mockPings = (rows) => {
    const handle = setTimeout(() => {
      const newRows = mockUpdate(rows)
      setData(newRows)
      mockPings(newRows)
    }, TIME_OUT)

    return handle
  }


  // filter data
  const updateAll = (data) => {
    let filteredData = queryData(data, query)
    filteredData = filterData(filteredData, filterState)

    setFiltered(filteredData)

    setStatuses(getOptions(filteredData, 'status'))
    setProjects(getOptions(filteredData, 'project'))
    setRegions(getOptions(filteredData, 'region'))
  }


  const handleQuery = ({query}) => {
    setQuery(query)
    setUpdateID(prev => prev + 1)
  }


  // todo(nc): support multi-select (via components), likely
  const handleFilterChange = (type, field, val) => {
    dispatch({type, field, val})
    setUpdateID(prev => prev + 1)
  }


  const handleSelect = (sel) => {
    if (sel.objs.length)
      setSelected(sel.objs)
    else
      setSelected(null)

    setUpdateID(prev => prev + 1)
  }


  return (
    <Root>
      <TopContainer>
        <Overview
          data={filtered}
          selected={selected}
        />

        {ENABLE_MAP && filtered &&
          <Map
            data={data}
            selected={selected}
            updateID={updateID}
          />}
        {!ENABLE_MAP && <div style={{height: 450, width: 700, background: '#ccc'}} />}
      </TopContainer>

      <TableContainer>
        {filtered &&
          <Table
            primaryKey={PRIMARY_KEY}
            rows={filtered}
            columns={columns}
            enableSorting
            onSearch={handleQuery}
            onColumnMenuChange={() => {}}
            onSelect={handleSelect}
            middleComponent={
              <>
                {statuses && <Filter id="status" label="Status" options={statuses} onChange={handleFilterChange} />}
                {projects && <Filter id="project" label="Project" options={projects} width={175} onChange={handleFilterChange} />}
                {regions && <Filter id="region" label="Region" options={regions} width={200} onChange={handleFilterChange} />}
                {selected && <Button className="details-btn" variant="contained" color="primary" onClick={() => setShowDetails(true)}>Details</Button>}
              </>
            }
          />
        }
      </TableContainer>

      {showDetails &&
        <DetailsSidebar
          columns={columns}
          selected={selected}
          onClose={() => setShowDetails(false)}
        />
      }
    </Root>
  )
}

const Root = styled.div`
  margin: 65px 10px 10px 10px;

  && .MuiDrawer-paper {
    margin-top: 60px;
  }
  .details-btn {
    margin-left: 20px;
  }

`

const TopContainer = styled.div`
  display: flex;
  align-items: stretch;
  justify-content: space-between;

  padding: 10px 0;
`

const TableContainer = styled.div`

`


export default StatusView
