import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import {useLocation, useHistory} from 'react-router-dom'
import 'regenerator-runtime'

import Button from '@material-ui/core/Button'
import Divider from '@material-ui/core/Divider'
import CaretIcon from '@material-ui/icons/ExpandMoreRounded'
import UndoIcon from '@material-ui/icons/UndoRounded'
import Alert from '@material-ui/lab/Alert'

import columns from './columns'
import Table from '../../../components/table/Table'
import FilterMenu from '../../../components/FilterMenu'
import Map from '../../../components/Map'
import Charts from './charts/Charts'
import QueryViewer from './QueryViewer'
import { useProgress } from '../../../components/progress/ProgressProvider'
import ToggleButton from '@material-ui/lab/ToggleButton'
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup'


import * as BK from '../../apis/beekeeper'
import * as BH from '../../apis/beehive'
import config from '../../../config'


const ELASPED_THRES = 90000
const TIME_OUT = 5000
const PRIMARY_KEY = 'id'

const HOST_SUFFIX_MAPPING = config.admin.hostSuffixMapping



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


function mergeParams(params: URLSearchParams, field: string, val: string, replace = false) : string  {
  const str = params.get(field)
  const existing = str?.length ? str.split(',') : []

  if (existing.includes(val)) {
    existing.splice(existing.indexOf(val), 1)
    return existing.join(',')
  }

  return replace ? [val].join(',') : [...existing, val].join(',')
}



function getElaspedTimes(metrics: BH.AggMetrics, nodeID: string) {
  const byHost = {}

  Object.keys(metrics[nodeID]).forEach(host => {

    const timestamp = metrics[nodeID][host]['sys.uptime'][0].timestamp

    const elapsedTime = (new Date().getTime() - new Date(timestamp).getTime())

    const suffix = host.split('.')[1]
    const key = suffix ? (HOST_SUFFIX_MAPPING[suffix] || suffix) : host
    byHost[key] = elapsedTime
  })

  return byHost
}


function getMetric(
  aggMetrics: BH.AggMetrics,
  nodeID: string,
  metricName: string,
  latestOnly = true
) {
  const metricObjs = aggMetrics[nodeID]

  const valueObj = {}
  Object.keys(metricObjs).forEach(host => {
    const m = metricObjs[host][metricName]
    if (!m) return

    const val = latestOnly ? m[m.length - 1].value : m

    const suffix = host.split('.')[1]
    const key = suffix ? (HOST_SUFFIX_MAPPING[suffix] || suffix) : host
    valueObj[key] = val
  })

  return valueObj
}



function getSanity(
  metrics: BH.AggMetrics,
  nodeID: string
) {
  const metricObjs = metrics[nodeID]

  const valueObj = {}
  Object.keys(metricObjs).forEach(host => {
    if (!host.includes('ws-nxcore'))
      return

    const metric = metricObjs[host]
    if (!metric) return

    let passed = 0
    let warnings = 0
    let failed = 0

    // determine pass ratio
    Object.keys(metric).forEach(key => {
      if (!key.includes('sys.sanity_status'))
        return

      const {value, meta} = metric[key][0]
      const severity = meta['severity']

      passed = value == 0 ? passed + 1 : passed
      warnings = value > 0 && severity == 'warning' ? warnings + 1 : warnings
      failed = value > 0 && severity == 'fatal' ? failed + 1 : failed
    })

    const suffix = host.split('.')[1]
    const key = suffix ? (HOST_SUFFIX_MAPPING[suffix] || suffix) : host
    valueObj[key] = metric
    valueObj[key].passed = passed
    valueObj[key].warnings = warnings
    valueObj[key].failed = failed
  })

  return valueObj
}


const determineStatus = (elaspedTimes: {[host: string]: number}) => {
  if (Object.values(elaspedTimes).some(val => val > ELASPED_THRES))
    return 'not reporting'
  return 'reporting'
}


// join beehive and beekeeper data, basically
function mergeMetrics(data: BK.State[], metrics: BH.AggMetrics, temps) {
  const joinedData = data.map(nodeObj => {
    const id = nodeObj.id.toLowerCase()
    if (!(id in metrics)) return nodeObj

    const elaspedTimes = getElaspedTimes(metrics, id)

    // get vsn from arbitrary host
    const someHost = Object.keys(metrics[id])[0]
    const vsn = metrics[id][someHost]['sys.uptime'][0].meta.vsn


    const nodeTemps = (temps[id] && 'iio.in_temp_input' in temps[id]) ?
      temps[id]['iio.in_temp_input'] : null

    const temp = nodeTemps ? nodeTemps[nodeTemps.length-1].value / 1000 : -999

    return {
      ...nodeObj,
      vsn,
      temp,
      status: determineStatus(elaspedTimes),
      elaspedTimes,
      uptimes: getMetric(metrics, id, 'sys.uptime'),
      sysTimes: getMetric(metrics, id, 'sys.time'),
      cpu: getMetric(metrics, id, 'sys.cpu_seconds', false),
      memTotal: getMetric(metrics, id, 'sys.mem.total', true),
      memFree: getMetric(metrics, id, 'sys.mem.free', true),
      memAvail: getMetric(metrics, id, 'sys.mem.avail', true),
      fsAvail: getMetric(metrics, id, 'sys.fs.avail', false),
      fsSize: getMetric(metrics, id, 'sys.fs.size', false),
      sanity: getSanity(metrics, id)
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
    if (['query', 'details'].includes(key)) continue
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
  const { setLoading } = useProgress()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [filtered, setFiltered] = useState(null)
  const [filterState, setFilterState] = useState(null)

  // filter options
  const [statuses, setStatuses] = useState<Option[]>()
  const [projects, setProjects] = useState<Option[]>()
  // const [regions, setRegions] = useState<Option[]>()

  // filter state
  const [updateID, setUpdateID] = useState(0)
  const [nodeType, setNodeType] = useState<'all' | 'WSN' | 'Dell'>('all')

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
        const metrics = await BH.getLatestMetrics()
        const temps = await BH.getLatestTemp()
        setData(mergeMetrics(dataRef.current, metrics, temps))
        setLastUpdate(new Date().toLocaleTimeString('en-US'))

        // recursive
        ping()
      }, TIME_OUT)

      return handle
    }

    let handle
    setLoading(true)
    Promise.all([BK.fetchState(), BH.getLatestMetrics(), BH.getLatestTemp()])
      .then(([state, metrics, temps]) => {
        setData(state)

        const allData = mergeMetrics(state, metrics, temps)
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
  }, [query, status, project, region, nodeType])


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

    /* disabling node metric history for now
    setLoadingTicker(true)
    const id = selected[0].id
    BH.getNodeActivity(id)
      .then(activity => setActivity(activity))
      .finally(() => setLoadingTicker(false))
    */
  }, [selected])


  // filter data (todo: this can probably be done more efficiently)
  const updateAll = (d) => {
    const filterState = getFilterState(params)
    let filteredData = queryData(d, query)
    filteredData = filterData(filteredData, filterState)

    setFiltered(filteredData)
    setFilterState(filterState)

    setStatuses(getOptions(data, 'status'))
    setProjects(getOptions(data, 'project'))
    // setRegions(getOptions(data, 'region'))
  }


  const handleQuery = ({query}) => {
    if (query) params.set('query', query)
    else params.delete('query')
    history.push({search: params.toString()})
  }


  const handleFilterChange = (field: string, vals: {id: string, label: string}[]) => {
    if (field == 'nodeType') {
      const val = vals[vals.length - 1].id
      const newStr = mergeParams(params, field, val, true)

      if (!newStr.length) params.delete(field)
      else params.set(field, newStr)
      history.push({search: params.toString()})

      return
    }

    const val = vals[vals.length - 1].id
    const newStr = mergeParams(params, field, val)

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
            primaryKey={PRIMARY_KEY}
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
                {/*regions &&
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
  top: 0;
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

const FilterControls = styled.div`
  margin-Left: 1em;
  margin-top: 3px;

`



