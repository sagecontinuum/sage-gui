/* eslint-disable react/display-name */
import { useEffect, useState } from 'react'
import { useHistory, useLocation, Link } from 'react-router-dom'
import styled from 'styled-components'

import * as BH from '../../components/apis/beehive'

import Table from '../../components/table/Table'
import { useProgress } from '../../components/progress/ProgressProvider'
import { msToTime } from '../../components/utils/units'
import Checkbox from '../../components/input/Checkbox'

import FormControlLabel from '@mui/material/FormControlLabel'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Alert from '@mui/material/Alert'
import UndoIcon from '@mui/icons-material/UndoRounded'
import DownloadIcon from '@mui/icons-material/CloudDownloadOutlined'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import Popper from '@mui/material/Popper'

import { capitalize, groupBy } from 'lodash'

// import Clipboard from '~components/utils/Clipboard'
import Sidebar from './DataSidebar'
import Audio from '../../admin-ui/views/audio/Audio'
import QueryViewer from '../../components/QueryViewer'

import { schemeCategory10 } from 'd3-scale-chromatic'
import { Line } from 'react-chartjs-2'




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
}, /* {
  id: 'job',
  label: 'Job',
},*/ {
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
  'm': 'minute',
  'h': 'hour',
  '12h': '12 hours',
  'd': 'day'
}


type Unit = 'm' | 'h' | 'd'

type RangeIndicatorProps = {
  data: BH.Record[]
  unit: Unit
}

function RangeIndicator(props: RangeIndicatorProps) {
  const {data, unit} = props
  const start = data[0].timestamp
  const end = data[data.length - 1].timestamp


  return (
    <span>
      {new Date(end).toLocaleString()} to {' '}
      {['m', 'h'].includes(unit) ?
          new Date(start).toLocaleTimeString() :
          new Date(start).toLocaleString()
      }
    </span>
  )
}



const VertDivider = () =>
  <Divider orientation="vertical" flexItem style={{margin: '0 15px' }} />



const getUniqueOpts = (data) =>
  data.filter((v, i, self) => v && self.indexOf(v) == i)
    .map(v => ({id: v, label: v}))



const getCurlCmd = (query: object) => {
  return `curl -d ${JSON.stringify(query)}`
}


async function getFilterMenus(plugin) {
  const data = await BH.getData({
    start: `-1d`,
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


function getChartDatasets(data: BH.Record[]) {
  const datasets = []

  const byName = groupBy(data, 'name')

  let idx = 0
  Object.keys(byName).forEach((name, i) => {
    const namedData = byName[name]

    const grouped = groupBy(namedData, 'sensor')
    const hasSesnors = Object.keys(grouped)[0] != 'undefined'

    Object.keys(grouped)
      .forEach((key, j) => {
        const d = grouped[key].map(o => ({
          x: new Date(o.timestamp).getTime(),
          y: o.value
        }))

        datasets.push({
          label: name + (hasSesnors ? ` - ${key}` : ''),
          data: d,
          pointRadius: 0,
          fill: false,
          borderColor: schemeCategory10[idx % 10]
        })

        idx += 1
      })
  })

  return datasets
}


function LineChart(props) {
  const {data} = props

  const datasets = getChartDatasets(data)

  return (
    <Line
      options={{
        scales: {
          xAxes: [{
            type: 'time',
            display: true,
            scaleLabel: {
              display: true
            }
          }]
        }
      }}
      data={{
        datasets
      }}
    />
  )

}


const defaultPlugin = 'plugin-iio:0.4.5'


const isMediaApp = (app) =>
  (app || '').match(/image|audio/g)


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

  const [query, setQuery] = useState<object>()
  const [data, setData] = useState<BH.Record[]>()
  const [error, setError] = useState()
  const [lastN, setLastN] = useState<{total: number, limit: number}>()
  const [chart, setChart] = useState<{x: string, y: number}[]>()

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

  // update selected filters whenever url param changes
  useEffect(() => {
    const filterState = getFilterState(params)
    setFilters(filterState)
  }, [app, name, node, sensor])


  // update filter menus whenever url params changes
  useEffect(() => {
    if (!app) return

    getFilterMenus(app)
      .then((menuItems) => setMenus(prev => ({...prev, ...menuItems})))
  }, [app])


  useEffect(() => {
    const plugin = app || defaultPlugin

    function fetchAppMenu() {
      const query = {
        start: `-1d`,
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
        start: unit == '12h' ? '-12h' : `-1${unit}`,
        filter: {
          plugin: plugin,
          ...(node ? {vsn: node} : {}),
          ...(name ? {name} : {}),
          ...(sensor ? {sensor} : {}),
        }
      }
      setQuery(query)

      setLoading(true)
      BH.getData(query)
        .then((data) => {
          data = (data || [])

          // limit amount of data
          const total = data.length
          const limit = 10000
          if (total > limit) {
            data = data.slice(0, limit)
            setLastN({total, limit})
          } else {
            setLastN(null)
          }

          data = data
            .map((o, i) => ({...o, ...o.meta, rowID: i}))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

          // experimental charts
          if (app && node && !isMediaApp(app) && data.length > 0) {
            setChart(data)
          } else {
            setChart(null)
          }

          setData(data)

          // reset page any time more data is fetched
          setPage(0)
        }).catch(error => setError(error))
        .finally(() => setLoading(false))
    }

    fetchAppMenu()
    fetchData()
    fetchFilterMenus()
  }, [setLoading, unit, app, node, name, sensor])


  // relative time and show meta checkbox events
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


  const clearParams = () => {
    setPage(0)
    params.delete('nodes')
    params.delete('names')
    params.delete('sensors')
    params.delete('window')
    params.delete('apps')
  }


  const handleCheck = (evt, name) => {
    setChecked(prev => ({...prev, [name]: evt.target.checked}))
  }

  const handleFilterChange = (field: string, val: {id: string, label: string}) => {
    if (!val) {
      params.delete(field)
    } else {
      params.set(field, val.id)
    }
    history.push({search: params.toString()})
  }

  const handleUnitChange = (val) => {
    params.set('window', val)
    history.push({search: params.toString()})
  }

  const handleRemoveFilters = () => {
    clearParams()
    params.set('apps', defaultPlugin)
    history.push({search: params.toString()})
  }


  const goTo = (appQuery: string) => {
    params.set('apps', appQuery)
    history.push({search: params.toString()})
  }


  return (
    <Root isMedia={isMediaApp(app)}>
      <div className="flex">
        <Sidebar width="225px" style={{padding: '0 10px'}}>
          <h2 className="filter-title">Filters</h2>

          <div className="shortcuts">
            <a onClick={() => goTo('plugin-image-sampler.*')}>Images</a> |{' '}
            <a onClick={() => goTo('plugin-audio-sampler.*')}>Audio</a>
          </div>

          {menus && facetList.map(facet => {
            const label = capitalize(facet)
            const value = filters[facet][0] || ''

            // if sensor filter, and no options, don't show
            if (facet == 'sensors' && !menus[facet].length) {
              return <></>
            }

            return (
              <Menu
                key={facet}
                options={menus[facet]}
                renderInput={(props) => <TextField {...props} label={label} />}
                PopperComponent={
                  (props) => <Popper {...props} style={{width: 300, zIndex: 9999}}/>
                }
                value={value}
                onChange={(evt, val) => handleFilterChange(facet, val)}
              />
            )
          })}

          <h3>Time Ranges</h3>
          <FormControl variant="outlined" style={{width: 150}}>
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
        </Sidebar>

        <Main>
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

          {/*
          <Clipboard
            content={getCurlCmd(query)}
          />
          */}

          <br />
          {chart &&
            <LineChart data={chart} />
          }

          {lastN &&
            <Alert severity="info">
              There are {lastN.total.toLocaleString()} records for this query.
              Listing the last {lastN.limit.toLocaleString()}.
            </Alert>
          }

          {error &&
            <Alert severity="error">{error.message}</Alert>
          }

          {data?.length == 0 &&
            <Alert severity="info">No recent data found <b>for the last {units[unit]}</b></Alert>
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
              rowsPerPage={isMediaApp(app) ? 20 : 100}
              limit={data.length} //todo(nc): "limit" is fairly confusing
              emptyNotice={
                <span className="flex">
                  <span>No records found from</span>&nbsp;<RangeIndicator data={data} unit={unit}/>
                </span>
              }
              disableRowSelect={() => true}
              leftComponent={
                <div className="flex">
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
                </div>
              }
              middleComponent={
                <RangeCtrls className="flex">
                  {data &&
                    <RangeIndicator data={data} unit={unit}/>
                  }
                  <VertDivider />
                </RangeCtrls>
              }
            />
          }
        </Main>
      </div>
    </Root>
  )
}

const Root = styled.div<{isMedia: boolean}>`
  margin-left: 0;

  h1 {
    font-size: 1.5em;
  }

  .filter-title {
    margin: 20px 0px;
  }

  .shortcuts {
    margin-bottom: 30px;
  }

  .MuiInputBase-root {
    background: #fff;
  }

  /* remove some styles when displaying media */
  ${props => props.isMedia &&
    `
    tr:nth-child(odd) {
      background: none;
    }
    tr.MuiTableRow-root:hover {
      background-color: initial;
    }
    `
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

const Menu = styled(Autocomplete)`
  margin: 15px 0px;
  background: #fff;
`

const RangeCtrls = styled.div`
  margin-left: auto;
  height: 100%;
`

