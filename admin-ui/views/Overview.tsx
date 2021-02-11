import React, { useState, useEffect, useReducer } from 'react'
import styled from 'styled-components'

import Table from '../../components/table/Table'
import Filter from '../../components/Filter'
import Map from '../../components/Map'

import config from '../config'
const url = config.beekeeper

const ENABLE_MAP = true


const columns = [
  {
    id: 'status',
    label: 'Status',
    format: (val) => getStateIcon(val)
  },
  {id: 'Node CNAME', label: 'Name'},
  {id: 'NODE_ID', label: 'Node ID'},
  {id: 'rSSH'},
  {id: 'iDRAC IP'},
  {id: 'iDRAC Port'},
  {id: 'eno1 address'},
  {id: 'eno2 address', hide: true},
  {id: 'Provisioning Date (version)', label: 'Provisioning Date'},
  {id: 'OS Version'},
  {id: 'Service Tag'},
  {id: 'Special Devices'},
  {id: 'VSN', hide: true},
  {id: 'BIOS Version', hide: true},
  {id: 'Lat', hide: true},
  {id: 'Lon', hide: true},
  {id: 'Location', hide: true},
  {id: 'Contact', hide: true},
  {id: 'Notes', hide: true}
]


type NodeStatus = 'active' | 'warning' | 'failed' | 'inactive'

const getStateIcon = (status: NodeStatus) => {
  if (status == 'active')
    return <Icon className="material-icons success">check_circle</Icon>
  else if (status == 'warning')
    return <Icon className="material-icons warning">warning_amber</Icon>
  else if (status == 'failed')
    return <Icon className="material-icons warning">error_outline</Icon>
  else
    return <Icon className="material-icons inactive">remove_circle_outline</Icon>
}

const Icon = styled.span`
  margin-left: 10px;
`



const mockState = (data: object[]) => {
  return data.map(obj => ({
    ...obj,
    status: obj['Status'] == 'Up' ? 'active' : 'inactive',
    region: obj['Location'].slice(obj['Location'].indexOf(',') + 1),
    project: obj['Node CNAME'].slice(obj['Node CNAME'].indexOf('-') + 1, obj['Node CNAME'].lastIndexOf('-'))
  }))
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



type Option = {id: string, label: string}

function Overview() {
  const [data, setData] = useState(null)
  const [filtered, setFiltered] = useState(null)

  const [query, setQuery] = useState('')

  // filter options
  const [statuses, setStatuses] = useState<Option[]>()
  const [projects, setProjects] = useState<Option[]>()
  const [regions, setRegions] = useState<Option[]>()

  // filter state
  const [filterState, dispatch] = useReducer(filterReducer, initialState)


  // load data
  useEffect(() => {
    fetch(`${url}/blades.json`)
      .then(res => res.json())
      .then(data => {
        // add state and regions
        let rows = mockState(data)
        setData(rows)

        updateAll(rows)
      })

  }, [])


  // effect for state change
  useEffect(() => {
    if (!data) return
    updateAll(data)
  }, [query, filterState])


  // filter data
  const updateAll = (data) => {
    let filteredData = queryData(data, query)
    filteredData = filterData(filteredData, filterState)

    setFiltered(filteredData)

    setStatuses(getOptions(filteredData, 'status'))
    setProjects(getOptions(filteredData, 'project'))
    setRegions(getOptions(filteredData, 'region'))
  }


  const handleColumnChange = () => {

  }


  // todo(nc): support multi-select (via components), likely
  const handleFilterChange = (type, field, val) => {
    dispatch({type, field, val})
  }


  return (
    <Root>
      <TopContainer>
        {ENABLE_MAP && <Map data={filtered} />}
      </TopContainer>

      <TableContainer>
        {filtered &&
          <Table
            rows={filtered}
            columns={columns}
            onSearch={({query}) => setQuery(query)}
            onColumnMenuChange={handleColumnChange}
            middleComponent={
              <>
                {statuses && <Filter id="status" label="Status" options={statuses} onChange={handleFilterChange} />}
                {projects && <Filter id="project" label="Project" options={projects} width={175} onChange={handleFilterChange} />}
                {regions && <Filter id="region" label="Region" options={regions} width={200} onChange={handleFilterChange} />}
              </>
            }
          />
        }
      </TableContainer>
    </Root>
  )
}

const Root = styled.div`
  padding: 10px;
`

const TopContainer = styled.div`
  height: 500px;
`

const TableContainer = styled.div`

`


export default Overview
