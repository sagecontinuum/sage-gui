/* eslint-disable react/display-name */
import { useEffect, useState } from 'react'
import { useHistory, useLocation, Link } from 'react-router-dom'
import styled from 'styled-components'

import * as BH from '../../components/apis/beehive'

import Table from '../../components/table/Table'
import { useProgress } from '../../components/progress/ProgressProvider'
import { msToTime } from '../../components/utils/units'
import Checkbox from '../../components/input/Checkbox'
import FilterMenu from '../../components/FilterMenu'

import FormControlLabel from '@mui/material/FormControlLabel'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Alert from '@mui/material/Alert'
import CaretIcon from '@mui/icons-material/ExpandMoreRounded'
import UndoIcon from '@mui/icons-material/UndoRounded'
import DownloadIcon from '@mui/icons-material/CloudDownloadOutlined'

import { capitalize } from 'lodash'

import Sidebar, {FilterTitle} from './DataSidebar'

import Audio from '../../admin-ui/views/audio/Audio'

import { Line } from 'react-chartjs-2'


import QueryViewer from '../../components/QueryViewer'


const relTime = val =>
  msToTime(new Date().getTime() - (new Date(val).getTime()))


const columns = [{
  id: 'vsn',
  label: 'VSN',
  format: (val, r) =>
    <a href={`https://admin.sagecontinuum.org/node/${r.node.toUpperCase()}`}>
      {val}
    </a>
}, {
  id: 'timestamp',
  label: 'Time',

}, {
  id: 'name',
  label: 'Name',
  format: (name) => <Link to={`/data-browser/ontology/${name}`}>{name}</Link>
}, {
  id: 'value',
  label: 'Value',
  format: (val) => {
    const isInOSN = /^https:\/\/storage.sagecontinuum.org/i.test(val)
    if (!isInOSN) return val

    if (val.includes('.jpg')) {
      return (
        <div className="flex column">
          <img src={val} width="550"/>
          <div className="flex justify-center">
            <Button startIcon={<DownloadIcon />} href={val}>
              {val.split('/').pop()}
            </Button>
          </div>
        </div>
      )
    }

    if (val.includes('.flac')) {
      return (
        <div className="flex column">
          <Audio dataURL={val}/>
          <div className="flex justify-center">
            <Button startIcon={<DownloadIcon />} href={val}>
              {val.split('/').pop()}
            </Button>
          </div>
        </div>
      )
    }

    return <a href={val}>{val.split('/').pop()}</a>
  }
}, {
  id: 'sensor',
  label: 'Sensor',
}, {
  id: 'job',
  label: 'Job',
}, {
  id: 'meta',
  label: 'Meta',
  format: (o) =>
    Object.keys(o).map(k => {
      return <div key={`meta-${k}`}><b>{k}</b>: {o[k]}</div>
    })
  ,
  hide: true
}]


const findColumn = (cols, name) =>
  cols.findIndex(o => o.id == name)



const units = {
  'm': 'min',
  'h': 'hour',
  'd': 'day'
}

type TIProps = {
  page: number
  unit: 'm' | 'h' | 'd'
}

function TimeIndicator(props: TIProps) {
  const {page, unit} = props

  return (
    <div>
      {page == 1 ?
        `now - 1 ${units[unit]} ago` :
        `${page - 1} ${units[unit]} ago - ${page } ${units[unit]} ago`
      }
    </div>
  )
}


type RangeIndicatorProps = {
  data: BH.Record[]
}

function RangeIndicator(props: RangeIndicatorProps) {
  const {data} = props
  const start = data[0].timestamp
  const end = data[data.length - 1].timestamp


  return (
    <span>
      {new Date(end).toLocaleString()} to  {new Date(start).toLocaleTimeString()}
    </span>
  )
}




const VertDivider = () =>
  <Divider orientation="vertical" flexItem style={{margin: '5px 15px' }} />



const getUniqueOpts = (data) =>
  data.filter((v, i, self) => self.indexOf(v) == i)
    .map(v => ({id: v, label: v}))



const getFilterVal = (items: string[]) => {
  return items.map(v => ({id: v, label: v}))
}



async function getFilterMenus(plugin) {
  const data = await BH.getData({
    start: `-4d`,
    tail: 1,
    filter: {
      plugin
    }
  })

  return {
    nodes: getUniqueOpts((data).map(o => o.meta.vsn)),
    names: getUniqueOpts((data).map(o => o.name)),
    sensors: getUniqueOpts((data).map(o => o.meta.sensor))
  }
}


function LineChart(props) {
  const {data} = props

  return (
    <Line
      data={{
        labels: data.map(o => o.x),
        datasets: [
          {data: data.map(o => o.y)}
        ]
      }}
    />
  )

}


const defaultPlugin = 'plugin-iio:0.4.5'
//const defaultNode = 'W023'

const initFilterState = {
  apps: [defaultPlugin],
  nodes: [],
  names: [],
  sensors: []
}

const facetList = Object.keys(initFilterState)



export function getFilterState(params) {
  let init = {...initFilterState}
  for (const [key, val] of params) {
    init[key] = val.split(',')
  }

  return init
}



export default function DataPreview() {
  const params = new URLSearchParams(useLocation().search)
  const history = useHistory()
  const app = params.get('apps')
  const name = params.get('names')
  const node = params.get('nodes')
  const sensor = params.get('sensors')
  const unit = params.get('window') || 'm'


  const {loading, setLoading} = useProgress()

  const [cols, setCols] = useState(columns)

  const [page, setPage] = useState(0)


  const [checked, setChecked] = useState({
    relativeTime: true,
    showMeta: false,
  })

  const [data, setData] = useState<BH.Record[]>()
  const [error, setError] = useState()
  const [everyN, setEveryN] = useState<{total: number, every: number}>()
  const [lastN, setLastN] = useState<{total: number, limit: number}>()
  // const [chart, setChart] = useState<{x: string, y: number}[]>()

  // contents of dropdowns
  const [menus, setMenus] = useState<{[name: string]: string[]}>({
    apps: [],
    nodes: [],
    names: [],
    sensors: []
  })

  // selected filters
  const [filters, setFilters] = useState({
    apps: [defaultPlugin],
    nodes: [],
    names: [],
    sensors: []
  })


  useEffect(() => {
    const filterState = getFilterState(params)
    setFilters(filterState)
  }, [app, name, node, sensor])



  useEffect(() => {
    if (!app) return

    getFilterMenus(app)
      .then((menuItems) => setMenus(prev => ({...prev, ...menuItems})))
  }, [app])


  useEffect(() => {
    const plugin = app || defaultPlugin

    function fetchAppMenu() {
      const query = {
        start: `-4d`,
        tail: 1,
        filter: {
          plugin: `.*`
        }
      }

      setLoading(true)
      BH.getData(query)
        .then((data) => {
          data = getUniqueOpts(data.map(o => o.meta.plugin).filter(n => n))
          setMenus(prev => ({...prev, apps: data}))
        }).catch(error => setError(error))
    }

    function fetchFilterMenus() {
      getFilterMenus(plugin)
        .then((menuItems) => {
          setMenus(prev => ({...prev, ...menuItems}))
        })
    }

    function fetchData() {
      const query = {
        start: `-1${unit}`,
        filter: {
          plugin: plugin,
          ...(node ? {vsn: node} : {}),
          ...(name ? {name} : {}),
          ...(sensor ? {sensor} : {}),
        }
      }

      setLoading(true)
      BH.getData(query)
        .then((data) => {
          data = (data || [])

          // limit amount of data for now
          const total = data.length
          const limit = 50000
          if (total > limit) {
            data = data.slice(0, limit)
            setLastN({total, limit})
          } else {
            setLastN(null)
          }

          data = data
            .map((o, i) => ({...o, ...o.meta, rowID: i}))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

          setData(data)

          /* experimental chart (todo?)
          if (name) {
            const chartData = data
              .map(o => ({x: o.timestamp.split('T')[1].split('.').shift(), y: o.value}))

            setChart(chartData)
          }
          */

          // reset page any time more data is fetched
          setPage(0)
        }).catch(error => setError(error))
        .finally(() => setLoading(false))
    }

    fetchAppMenu()
    fetchData()
    fetchFilterMenus()
  }, [setLoading, unit, app, node, name, sensor])


  useEffect(() => {
    setCols(prev => {
      let idx
      if (checked.relativeTime) {
        idx = findColumn(prev, 'timestamp')
        prev[idx] = {...prev[idx], format: (val) => relTime(val)}
      } else {
        idx = findColumn(prev, 'timestamp')
        prev[idx] = {...prev[idx], format: (val) => val}
      }

      idx = findColumn(prev, 'meta')
      prev[idx] = {...prev[idx], hide: !checked.showMeta}

      return prev.slice(0)
    })
  }, [checked])


  const handleCheck = (evt, name) => {
    setChecked(prev => ({...prev, [name]: evt.target.checked}))
  }

  const handleFilterChange = (field: string, val: {id: string, label: string}) => {
    params.set(field, val.id)
    history.push({search: params.toString()})
  }

  const handleUnitChange = (val) => {
    params.set('window', val)
    history.push({search: params.toString()})
  }

  const handleRemoveFilters = () => {
    setPage(0)
    params.delete('nodes')
    params.delete('names')
    params.delete('sensors')
    params.delete('window')
    params.set('apps', defaultPlugin)
    history.push({search: params.toString()})
  }


  return (
    <Root>

      <div className="flex">
        <Sidebar width="200px">
          <FilterTitle>Filters</FilterTitle>

          {menus && facetList.map(facet => {
            const label = capitalize(facet)

            return (
              <FilterMenu
                key={facet}
                options={menus[facet]}
                value={getFilterVal(filters[facet])[0]}
                onChange={vals => handleFilterChange(facet, vals)}
                noSelectedSort={true}
                multiple={false}
                disableCloseOnSelect={false}
                label={label}
                ButtonComponent={
                  <FilterBtn>
                    <Button size="medium" fullWidth>{label}<CaretIcon /></Button>
                  </FilterBtn>
                }
              />
            )
          })}
        </Sidebar>

        <Main>
          {/* a message if we decide to use sampling
            everyN &&
              <Alert severity="info">
                There are {everyN.total.toLocaleString()} records for this query.
                Showing every {everyN.every.toLocaleString()}.
              </Alert>
          */}

          {lastN &&
            <Alert severity="info">
              There are {lastN.total.toLocaleString()} records for this query.
              Showing last {lastN.limit.toLocaleString()}.
            </Alert>
          }

          <div className="flex items-center gap">
            <div className="flex items-center">
              <div className="flex items-center">
                {Object.keys(filters).reduce((acc, k) => acc + filters[k].length, 0) > 1 &&
                  <Button
                    variant="outlined"
                    onClick={handleRemoveFilters}
                    startIcon={<UndoIcon />}
                  >
                    Reset
                  </Button>
                }

                <QueryViewer
                  filterState={
                    Object.keys(filters)
                      .filter(k => !['window'].includes(k))
                      .reduce((acc, k) => ({...acc, [k]: filters[k] }), {})
                  }
                />
              </div>
            </div>
          </div>

          {/*chart &&
            <LineChart data={chart} />
          */}

          <br/>


          {error &&
            <Alert severity="error">{error.message}</Alert>
          }

          {data?.length == 0 &&
            <Alert severity="info">No recent data found</Alert>
          }

          {/* todo(nc): here we have to check data.length because of bug in table component when pagination is used */}
          {data && data?.length > 0 &&
            <Table
              primaryKey="rowID"
              enableSorting
              columns={cols}
              rows={data}
              pagination
              page={page}
              limit={data.length}
              emptyNotice={
                <span className="flex">
                  <span>No records found from</span>&nbsp;<TimeIndicator page={page} unit={unit}/>
                </span>
              }
              disableRowSelect={() => true}

              leftComponent={
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checked.relativeTime}
                          onChange={(evt) => handleCheck(evt, 'relativeTime')}
                        />
                      }
                      label="relative time"
                    />

                    <FormControlLabel
                      control={<Checkbox checked={checked.showMeta} onChange={(evt) => handleCheck(evt, 'showMeta')} />}
                      label="meta"
                    />
                  </div>

                  <div className="flex items-center">
                    <FormControl variant="outlined" style={{width: '80px'}}>
                      <InputLabel id="unit-label">Window</InputLabel>
                      <Select
                        labelId="unit-label"
                        id="unit"
                        value={unit}
                        onChange={evt => handleUnitChange(evt.target.value)}
                        label="Window"
                        margin="dense"
                      >
                        {Object.keys(units)
                          .map(k =>
                            <MenuItem value={k} key={k}>{units[k]}</MenuItem>
                          )
                        }
                      </Select>
                    </FormControl>
                    <VertDivider />

                    {/*data && <div>{data.length} record{data.length == 1 ? '' : 's'}</div>*/}

                    {data &&
                      <RangeIndicator data={data}/>
                    }

                    <VertDivider />
                  </div>
                </div>
              }
            />
          }
        </Main>
      </div>
    </Root>
  )
}

const Root = styled.div`
  margin-left: 0;

  h1 {
    font-size: 1.5em;
  }
`

const Main = styled.div`
  position: relative;
  height: 100%;
  margin: 30px 20px 30px 0;
  padding: 0 0 0 20px;
  width: 100%;

  tr.MuiTableRow-root:hover,
  .MuiTableRow-hover:hover  {
    background-color: none !important;
  }

  .MuiAlert-root {
    margin-bottom: 1em;
  }
`

const FilterBtn = styled.div`
  button {
    padding-left: 30px;
    display: flex;
    justify-content: start;
  }
`

