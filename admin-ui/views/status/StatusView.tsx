import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import {useLocation, useHistory} from 'react-router-dom'
import 'regenerator-runtime'

import Button from '@material-ui/core/Button'
import Divider from '@material-ui/core/Divider'
import CaretIcon from '@material-ui/icons/ExpandMoreRounded'
import InfoIcon from '@material-ui/icons/InfoOutlined'
import UndoIcon from '@material-ui/icons/UndoRounded'

import columns from './columns'
import Table from '../../../components/table/Table'
import FilterMenu from '../../../components/FilterMenu'
import Map from '../../../components/Map'
import Charts from './Charts'
import QueryViewer from './QueryViewer'

import config from '../../../config'
import DetailsSidebar from './DetailsSidebar'

import * as BK from '../../apis/beekeeper'
import * as BH from '../../apis/beehive'


const ENABLE_MAP = true
const ELASPED_THRES = 90000
const TIME_OUT = 2000
const ACTIVITY_LENGTH = config.ui.activityLength
const PRIMARY_KEY = 'id'



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



const getOptions = (data: object[], field: string) : Option[] =>
  [...new Set(data.map(obj => obj[field])) ]
    .map(name => ({id: name, label: name}))



const useParams = () =>
  new URLSearchParams(useLocation().search)


function mergeParams(params: URLSearchParams, field: string, val: string) : string  {
  const str = params.get(field)
  const existing = str?.length ? str.split(',') : []

  if (existing.includes(val)) {
    existing.splice(existing.indexOf(val), 1)
    return existing.join(',')
  }

  return [...existing, val].join(',')
}



function getMetric(
  metrics: AggMetrics,
  nodeID: string,
  metricName: string,
  latestOnly = true
) {
  const metricObjs = metrics[nodeID]

  const valueObj = {}
  Object.keys(metricObjs).forEach(host => {
    const m = metricObjs[host][metricName]

    // get latest value
    let val
    if (latestOnly)
      val = m[m.length - 1].value
    else
      val = m.map(o => o)

    if (host.includes('ws-nxcore'))
      valueObj['nx'] = val
    else if (host.includes('ws-rpi'))
      valueObj['rpi'] = val
    else
      valueObj['unknown'] = val
  })

  return valueObj
}


// join some beehive and beekeeper data
function joinData(data, metrics) {
  const joinedData = data.map(nodeObj => {
    const id = nodeObj.id.toLowerCase()
    if (!(id in metrics)) return nodeObj

    const memFree = getMetric(metrics, id, 'sys.mem.free', false)
    const timestamp = memFree.rpi[memFree.rpi.length - 1].timestamp
    const elaspedTime = (new Date().getTime() - new Date(timestamp).getTime())

    return {
      ...nodeObj,
      status: elaspedTime > ELASPED_THRES ? 'failed' : 'active',
      uptimes: getMetric(metrics, id, 'sys.uptime'),
      sysTimes: getMetric(metrics, id, 'sys.time'),
      cpu: getMetric(metrics, id, 'sys.cpu_seconds', false),
      memTotal: getMetric(metrics, id, 'sys.mem.total', false),
      memFree: memFree
    }
  })

  return joinedData
}


const initialState = {
  status: [],
  project: [],
  region: []
}


function getFilterState(params) {
  let init = {...initialState}
  for (const [key, val] of params) {
    if (key == 'query') continue
    init[key] = val.split(',')
  }

  return init
}


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
  const region = params.get('region')


  // all data and current state of filtered data
  const [data, setData] = useState(null)
  const [filtered, setFiltered] = useState(null)
  const [filterState, setFilterState] = useState(null)

  // filter options
  const [statuses, setStatuses] = useState<Option[]>()
  const [projects, setProjects] = useState<Option[]>()
  const [regions, setRegions] = useState<Option[]>()

  // filter state
  const [updateID, setUpdateID] = useState(0)

  // selected
  const [selected, setSelected] = useState(null)
  const [showDetails, setShowDetails] = useState(false)


  // keep a ticker of recent activity
  const [activity, setActivity] = useState({})


  /**
   * load data
   */
  useEffect(() => {
    let handle

    (async () => {
      const data = await BK.fetchStatus()
      setData(data)

      const metrics = await BH.getLatestMetrics()
      const allData = joinData(data, metrics)
      setData(allData)

      handle = ping(data)
    })()

    return () => {
      clearTimeout(handle)
    }
  }, [])



  // effect for updating on state changes
  useEffect(() => {
    if (!data) return
    updateAll(data)

    // force mapbox rerender and avoid unnecessary rerenders
    setUpdateID(prev => prev + 1)
  }, [query, status, project, region])


  // effect for activity updates
  useEffect(() => {
    if (!data) return
    updateAll(data)
  }, [data])


  // latestMetrics
  const ping = (data) => {
    const handle = setTimeout(async () => {
      const metrics = await BH.getLatestMetrics()
      setData(joinData(data, metrics))

      // recursive
      ping(data)
    }, TIME_OUT)

    return handle
  }


  // filter data
  const updateAll = (data) => {
    const filterState = getFilterState(params)
    let filteredData = queryData(data, query)
    filteredData = filterData(filteredData, filterState)

    setFiltered(filteredData)
    setFilterState(filterState)

    setStatuses(getOptions(data, 'status'))
    setProjects(getOptions(data, 'project'))
    setRegions(getOptions(data, 'region'))
  }


  const handleQuery = ({query}) => {
    if (query) params.set('query', query)
    else params.delete('query')
    history.push({search: params.toString()})
  }


  const handleFilterChange = (field, vals) => {
    const val = vals[vals.length - 1].id
    const newStr = mergeParams(params, field, val)

    if (!newStr.length) params.delete(field)
    else params.set(field, newStr)
    history.push({search: params.toString()})
  }


  const handleRemoveFilters = () => {
    history.push({search: ''})
  }


  const handleSelect = (sel) => {
    setSelected(sel.objs.length ? sel.objs : null)
    setUpdateID(prev => prev + 1)
  }


  return (
    <Root>
      <TopContainer>
        <Charts
          data={filtered}
          selected={selected}
          activity={activity}
        />

        {ENABLE_MAP && filtered &&
          <Map
            data={filtered}
            selected={selected}
            updateID={updateID}
          />
        }
        {!ENABLE_MAP && <MapPlaceholder />}
      </TopContainer>

      <TableContainer>
        {filtered &&
          <Table
            primaryKey={PRIMARY_KEY}
            rows={filtered}
            columns={columns}
            enableSorting
            search={query}
            onSearch={handleQuery}
            onColumnMenuChange={() => {}}
            onSelect={handleSelect}
            middleComponent={
              <>
                {statuses ?
                  <FilterMenu
                    options={statuses}
                    value={filterState.status}
                    onChange={vals => handleFilterChange('status', vals)}
                    ButtonComponent={
                      <Button style={{marginLeft: 10}}>
                        Status
                        <CaretIcon />
                      </Button>
                    }
                  /> : <></>
                }
                {/*projects &&
                  <FilterMenu
                    options={projects}
                    value={filterState.project}
                    onChange={vals => handleFilterChange('project', vals)}
                    ButtonComponent={
                      <Button>
                        Project <CaretIcon />
                      </Button>
                    }
                  />
                }
                {regions &&
                  <FilterMenu
                    options={regions}
                    value={filterState.region}
                    onChange={vals => handleFilterChange('region', vals)}
                    ButtonComponent={
                      <Button>
                        Region <CaretIcon />
                      </Button>
                    }
                  />
                */}

                {selected &&
                  <>
                    <VertDivider />
                    <Button variant="contained"
                      color="primary"
                      onClick={() => setShowDetails(true)}
                      startIcon={<InfoIcon />}
                      size="small"
                    >
                      Details
                    </Button>
                  </>
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


const VertDivider = (props) =>
  <Divider orientation="vertical" flexItem style={{margin: '5px 15px 5px 15px' }} />


const Root = styled.div`
  && .MuiDrawer-paper {
    margin-top: 60px;
  }
`

const TopContainer = styled.div`
  display: flex;
  padding: 5px 0 10px 0;
`

const TableContainer = styled.div`

`

const MapPlaceholder = styled.div`
  height: 450px;
  width: 800px;
  background: #ccc;
`

