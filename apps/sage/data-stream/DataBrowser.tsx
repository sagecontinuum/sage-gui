/* eslint-disable react/display-name */
import { useEffect, useState } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import * as BH from '/components/apis/beehive'

import Table from '/components/table/Table'
import { useProgress } from '/components/progress/ProgressProvider'
import { msToTime } from '/components/utils/units'
import Checkbox from '/components/input/Checkbox'

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

import DatePicker  from '@mui/lab/DatePicker'
import TimePicker  from '@mui/lab/TimePicker'
import LocalizationProvider from '@mui/lab/LocalizationProvider'
import AdapterDateFns from '@mui/lab/AdapterDateFns'

import { capitalize } from 'lodash'

import Clipboard from '/components/utils/Clipboard'
import Sidebar from '../data-commons/DataSidebar'
import Audio from '/components/viz/Audio'
import QueryViewer from '/components/QueryViewer'
import TimeSeries from './TimeSeries'

// support custom viewers?
// import SmokeMap from './viewers/SmokeMap'


const exts = {
  image: ['.jpg', '.jpeg', '.png', '.gif'],
  video: ['.mp4']
}

const defaultPlugin = 'plugin-iio:0.4.5'

const relTime = val =>
  msToTime(new Date().getTime() - (new Date(val).getTime()))


const columns = [{
  id: 'vsn',
  label: 'VSN',
  format: (val, r) =>
    <a href={`/node/${r.node.toUpperCase()}`}>
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

    const suffix = val.slice(val.lastIndexOf('.'))

    if (val.includes('.jpg')) {
      return (
        <div className="flex column">
          <img src={val} style={{maxWidth: '760px'}} />
          <div className="flex justify-center">
            <Button startIcon={<DownloadIcon />} href={val}>
              {val.split('/').pop()}
            </Button>
          </div>
        </div>
      )
    }
    else if (val.includes('.flac')) {
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
    } else if (exts.video.includes(suffix)) {
      return (
        <div className="flex column">
          {/*
          <video style={{maxWidth: '1280px'}} controls>
            <source src={val} type="video/mp4" />
            Your browser does not support video
          </video>
          */}
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


type Unit = 'm' | 'h' | 'd'

const units = {
  'm': 'minute',
  'h': 'hour',
  '12h': '12 hours',
  'd': 'day',
  '2d': '2 days',
  '7d': '7 days',
  '30d': '30 days [slow]',
  '90d': '90 days [very slow]'
}

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
  data.sort()
    .filter((v, i, self) => v && self.indexOf(v) == i)
    .map(v => ({id: v, label: v}))



const getCurlCmd = (query: object) =>
  `curl ${BH.url}/query -d '${JSON.stringify(query)}'`


function getAppMenus() {
  return BH.getData({
    start: `-1d`,
    tail: 1,
    filter: {
      plugin: `.*`
    }
  }).then((data) =>
    getUniqueOpts(data.map(o => o.meta.plugin).filter(n => n))
  )
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
    nodes: getUniqueOpts(data.map(o => o.meta.vsn)),
    names: getUniqueOpts(data.map(o => o.name)),
    sensors: getUniqueOpts(data.map(o => o.meta.sensor))
  }
}


const getStartTime = (win: Unit) => {
  const amount = Number(win.slice(0, -1)) || 1
  const unit = win.charAt(win.length - 1)

  const datetime = new Date()
  if (unit == 'm')
    datetime.setMinutes(datetime.getMinutes() - amount)
  else if (unit == 'h')
    datetime.setHours(datetime.getHours() - amount)
  else if (win == 'd')
    datetime.setDate(datetime.getDate() - amount)
  else {
    alert(`getStartTime: win (window) not valid.  was window=${win}`)
    return
  }

  return new Date(datetime).toISOString()
}

const getEndTime = (start: string, win: Unit) => {
  const amount = Number(win.slice(0, -1)) || 1
  const unit = win.charAt(win.length - 1)

  const startTime = new Date(start)
  let endTime = new Date(start)
  if (unit == 'm')
    endTime.setMinutes(startTime.getMinutes() + amount)
  else if (unit == 'h')
    endTime.setHours(startTime.getHours() + amount)
  else if (unit == 'd')
    endTime.setDate(startTime.getDate() + amount)
  else {
    alert(`getEndTime: win (window) not valid.  was window=${win}`)
    return
  }

  return new Date(endTime).toISOString()
}


const isMediaApp = (app) =>
  (app || '').match(/image|audio|video|mobotix/g)

const isAudioApp = (app) =>
  (app || '').match(/audio/g)

const isSmokeApp = (app) =>
  (app || '').match(/smoke/g)


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
    if (key == 'start')
      continue
    init[key] = val.split(',')
  }

  return init
}



export default function DataPreview() {
  const params = new URLSearchParams(useLocation().search)
  const navigate = useNavigate()
  const app = params.get('apps')
  const name = params.get('names')
  const node = params.get('nodes')
  const sensor = params.get('sensors')

  const unit: Unit = params.get('window') || 'h'
  const start = params.get('start')

  const {setLoading} = useProgress()
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
  const [chart, setChart] = useState<BH.Record[]>()

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


  // update filter menus whenever app changes
  useEffect(() => {
    if (!app) return

    getFilterMenus(app)
      .then((menuItems) => setMenus(prev => ({...prev, ...menuItems})))
  }, [app])


  // show/hide sensor column if needed
  useEffect(() => {
    if (menus.sensors.length) {
      setCols(prev => {
        let idx = findColumn(prev, 'sensor')
        prev[idx] = {...prev[idx], hide: false}
        return prev.slice(0)
      })
    } else {
      setCols(prev => {
        let idx = findColumn(prev, 'sensor')
        prev[idx] = {...prev[idx], hide: true}
        return prev.slice(0)
      })
    }
  }, [menus.sensors])


  // initial loading of everything
  useEffect(() => {
    const plugin = app || defaultPlugin

    function fetchAppMenu() {
      getAppMenus()
        .then((data) => {
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
      const s = start || getStartTime(unit)
      const end = getEndTime(s, unit)

      const query = {
        start: s,
        end: end,
        filter: {
          plugin: plugin,
          ...(node ? {vsn: node} : {}),
          ...(name ? {name} : {}),
          ...(sensor ? {sensor} : {}),
        }
      }

      setQuery(query)

      // cancel old requests
      BH.abort()

      setLoading(true)
      BH.getData(query, true)
        .then((data) => {
          data = (data || [])

          // experimental charts
          if (plugin && node && !isMediaApp(app) && data.length > 0) {
            setChart(data)
          } else {
            setChart(null)
          }

          // limit amount of data for table
          const total = data.length
          const limit = 100000
          if (total > limit) {
            data = data.slice(-limit)
            setLastN({total, limit})
          } else {
            setLastN(null)
          }

          data = data
            .map((o, i) => ({...o, ...o.meta, rowID: i}))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

          setData(data)

          // reset page any time more data is fetched
          setPage(0)
          setLoading(false)
        }).catch(error => {
          if (error.name == 'AbortError') return
          setError(error)
          setLoading(false)
        })
    }

    fetchAppMenu()
    fetchData()
    fetchFilterMenus()
  }, [app, node, name, sensor, unit, start])


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
    params.delete('apps')
    params.delete('start')
    params.delete('window')
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
    navigate({search: params.toString()}, {replace: true})
  }

  const handleTimeChange = (val) => {
    const start = new Date(val).toISOString()
    params.set('start', start)
    navigate({search: params.toString()}, {replace: true})
  }

  const handleUnitChange = (val) => {
    params.set('window', val)
    navigate({search: params.toString()}, {replace: true})
  }

  const handleRemoveFilters = () => {
    clearParams()
    params.set('apps', defaultPlugin)
    navigate({search: params.toString()}, {replace: true})
  }


  const goToApp = (appQuery: string) => {
    params.delete('names')
    params.set('apps', appQuery)
    params.set('window', 'h')
    navigate({search: params.toString()}, {replace: true})
  }


  return (
    <Root isMedia={isMediaApp(app)}>
      <div className="flex">
        <Sidebar width="240px" style={{padding: '0 10px'}}>
          <h2 className="filter-title">Filters</h2>

          <div className="shortcuts">
            <a onClick={() => goToApp('plugin-image-sampler.*')}>Images</a> |{' '}
            <a onClick={() => goToApp('plugin-audio-sampler.*')}>Audio</a>
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


          <TimeOpts>
            <h3>Time Range</h3>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={start}
                onChange={(val) => handleTimeChange(val)}
                renderInput={(params) => <TextField {...params} />}
              />

              <TimePicker
                label="Start Time"
                value={start}
                onChange={(val) => handleTimeChange(val)}
                renderInput={(params) => <TextField {...params} />}
              />
            </LocalizationProvider>


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
          </TimeOpts>

          <h4>Download/CLI</h4>
          <CurlContainer>
            <Clipboard
              content={getCurlCmd(query)}
              tooltip="Copy curl CMD"
            />
          </CurlContainer>
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
                    Clear
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

          <br />
          {chart && !isSmokeApp(app) &&
            <TimeSeries data={chart} />
          }

          {/*chart && isSmokeApp(app) &&
            <SmokeMap data={chart} />
          */}

          {lastN &&
            <Alert severity="info">
              There are {lastN.total.toLocaleString()} records for this query.
              Listing the most recent {lastN.limit.toLocaleString()}.
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
              rowsPerPage={isAudioApp(app) ? 10 : (isMediaApp(app) ? 20 : 100)}
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
                <RangeInfo className="flex">
                  {data &&
                    <RangeIndicator data={data} unit={unit}/>
                  }
                  <VertDivider />
                </RangeInfo>
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

  h2, h3, h4 {
    color: #444;
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
  margin-bottom: 15px;
  background: #fff;
`

const TimeOpts = styled.div`
  margin: 2em 0;
  > div {
    margin-bottom: 15px;
  }
`

const CurlContainer = styled.div`
  pre {
    border: none;
    background: #fff !important;
  }
`

const RangeInfo = styled.div`
  margin-left: auto;
  height: 100%;
`

