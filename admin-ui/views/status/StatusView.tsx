import React, { useState, useEffect, useReducer } from 'react'
import styled from 'styled-components'

import Button from '@material-ui/core/Button'
import Drawer from '@material-ui/core/Drawer'
import TextField from '@material-ui/core/TextField'


import Table from '../../../components/table/Table'
import Filter from '../../../components/Filter'
import Map from '../../../components/Map'
import Overview from './Overview'

import config from '../../config'

const url = config.beekeeper


const ENABLE_MAP = true
const TIME_OUT = 2000

const MOCK_DOWN_NODE = 'Sage-NEON-04'
const PRIMARY_KEY = 'Node CNAME'


const columns = [
  {
    id: 'status',
    label: 'Status',
    format: (val) => getStateIcon(val)
  },
  {id: 'Node CNAME', label: 'Name'},
  {id: 'NODE_ID', label: 'Node ID'},
  {
    id: 'lastUpdated', label: 'Last Updated',
    format: (val) =>
      <b className={getUpdatedColor(val)}>
        {val == 'N/A' ? val : `${val}s`}
      </b>
  },
  {
    id: 'mem', label: 'Mem',
    format: (val) => <b>{val}gb</b>
  },
  {
    id: 'cpu', label: '% CPU',
    format: (val) => <b>{val}</b>
  },
  {
    id: 'storage', label: 'Storage',
    format: (val) =>
      <b>
        {val == 'N/A' ? val : `${val}%`}
      </b>
  },
  {id: 'rSSH'},
  {id: 'iDRAC IP'},
  {id: 'iDRAC Port'},
  {id: 'eno1 address'},
  {id: 'eno2 address', hide: true},
  {id: 'Provisioning Date (version)', label: 'Provisioning Date'},
  {id: 'OS Version', hide: true},
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
    return <Icon className="material-icons failed">error</Icon>
  else
    return <Icon className="material-icons inactive">remove_circle_outline</Icon>
}

const Icon = styled.span`
  margin-left: 10px;
`


const getUpdatedColor = (val) => {
  if (val == 'N/A') return 'failed'
  if (val > 11) return 'failed'
  if (val >= 8) return 'warning'
  return 'success'
}



const randomTime = () => Math.floor(Math.random() * 12) + 1
const randomMetric = () => (Math.random() * 100).toFixed(2)
const randomMem = () => (Math.random() * 192).toFixed(2)

const mockState = (data: object[]) => {
  return data.map(obj => ({
    ...obj,
    status: obj['Node CNAME'] == MOCK_DOWN_NODE ? 'failed' : (obj['Status'] == 'Up' ? 'active' : 'inactive'),
    region: obj['Location'].slice(obj['Location'].indexOf(',') + 1),
    project: obj['Node CNAME'].slice(obj['Node CNAME'].indexOf('-') + 1, obj['Node CNAME'].lastIndexOf('-')),
    lastUpdated: randomTime(),
    mem: randomMem(),
    cpu: randomMetric(),
    storage: randomMetric()
  }))
}


const mockUpdate = (data: any[]) => {
  return data.map((obj, i) => {
    return {
      ...obj,
      lastUpdated: obj['Node CNAME'] == MOCK_DOWN_NODE ? 'N/A' : (obj['lastUpdated'] + TIME_OUT / 1000) % 16,
      mem: obj.mem % 4 == 0 ? randomMem() : obj.mem,
      cpu: randomMetric(),
      storage: obj['lastUpdated'] % 5 == 0 ? randomMetric(): obj.storage
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

type Option = {id: string, label: string}

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
  const [selectedIDs, setSelectedIDs] = useState([])
  const [showDetails, setShowDetails] = useState(false)

  // load data
  useEffect(() => {
    let handle

    (async () => {
      const res = await fetch(`${url}/blades.json`)
      const data = await res.json()

      const rows = mockState(data)
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
      setSelected(sel.objs[0])
    else
      setSelected(null)

    console.log('selecting')
    if (sel.objs.length) {
      setSelectedIDs(sel.objs.map(o => o[PRIMARY_KEY]))
    } else {
      setSelectedIDs([])
    }

    setUpdateID(prev => prev + 1)
  }


  return (
    <Root>
      <TopContainer>
        <Overview data={filtered} selected={selected}/>

        {ENABLE_MAP && filtered &&
          <Map
            data={selectedIDs.length ? filtered.filter(o => selectedIDs.includes(o[PRIMARY_KEY]) ) : filtered }
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
        <Drawer anchor="right" open={true} onClose={() => setShowDetails(false)}>
          <Details>
            <h3>{selected['Node CNAME']}</h3>

            <table className="key-value-table">
              <tbody>
                <tr>
                  <td>Status</td>
                  <td className={selected['status'] == 'active' ? 'success' : ''}>
                    <b>{selected['status']}</b>
                  </td>
                </tr>

                {columns
                  .filter(o => !['status', 'Contact', 'Notes'].includes(o.id))
                  .map(o =>
                    <tr><td>{o.label || o.id}</td><td>{selected[o.id]}</td></tr>
                )}

                <tr><td colSpan={2}>Contact</td></tr>
                <tr>
                  <td colSpan={2} style={{fontWeight: 400, paddingLeft: '30px'}}>{selected['Contact']}</td>
                </tr>
              </tbody>
            </table>
            <br/><br/>
            <TextField
              id={`sage-${selected['Node CNAME']}-notes`}
              label="Notes"
              multiline
              rows={4}
              defaultValue={selected['Notes']}
              variant="outlined"
              fullWidth
            />
          </Details>
        </Drawer>
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


const Details = styled.div`
  margin-top: 70px;
  max-width: 385px;
  padding: 0 20px;
`


export default StatusView
