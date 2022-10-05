/* eslint-disable react/display-name */
import { useEffect, useState } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import * as BH from '/components/apis/beehive'

import Sidebar from '../data-commons/DataSidebar'
import Table from '/components/table/Table'
import Checkbox from '/components/input/Checkbox'
import Clipboard from '/components/utils/Clipboard'
import Audio from '/components/viz/Audio'
import QueryViewer from '/components/QueryViewer'
import TimeSeries from './TimeSeries'
import ErrorMsg from '../ErrorMsg'
import { relativeTime } from '/components/utils/units'
import { useProgress } from '/components/progress/ProgressProvider'

import {
  FormControlLabel, Button, Divider, Select,
  MenuItem, FormControl, InputLabel, Alert,
  Autocomplete, TextField, Popper, ToggleButtonGroup, ToggleButton
} from '@mui/material'

import UndoIcon from '@mui/icons-material/UndoRounded'
import DownloadIcon from '@mui/icons-material/CloudDownloadOutlined'
import AppsIcon from '@mui/icons-material/Apps'
import ImageIcon from '@mui/icons-material/ImageOutlined'
import AudioIcon from '@mui/icons-material/Headphones'

import DatePicker from '@mui/lab/DatePicker'
import TimePicker from '@mui/lab/TimePicker'
import LocalizationProvider from '@mui/lab/LocalizationProvider'
import AdapterDateFns from '@mui/lab/AdapterDateFns'

import { capitalize } from 'lodash'


import config from '/config'
const registry = config.dockerRegistry

// default app for initial view of data
const defaultPlugin = 'waggle/plugin-iio.*'

const exts = {
  image: ['.jpg', '.jpeg', '.png', '.gif'],
  audio: ['.flac'],
  video: ['.mp4']
}

type MimeType = keyof typeof exts


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
  format: (name) => <Link to={`/data/ontology/${name}`}>{name}</Link>
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

type Unit = keyof typeof units

type RangeIndicatorProps = {
  data: BH.Record[]
  unit: Unit
}

function RangeIndicator(props: RangeIndicatorProps) : JSX.Element {
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



const getUniqueOpts = (data: string[]) =>
  data.sort()
    .filter((v, i, self) => v && self.indexOf(v) == i)
    .map(v => ({id: v, label: v}))


const getUniqueAppOpts = (data: string[]) =>
  data.sort()
    .filter((v, i, self) => v && self.indexOf(v) == i)
    .map(v => ({id: v, label: v.replace(`${registry}/`, '')}))


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
    getUniqueAppOpts(data.map(o => o.meta.plugin))
  )
}


async function getFilterMenus(plugin) {
  const data = await BH.getData({
    start: `-1d`,
    tail: 1,
    filter: {
      ...(plugin ? {plugin} : {})
    }
  })

  return {
    nodes: getUniqueOpts(data.map(o => o.meta.vsn)),
    names: getUniqueOpts(data.map(o => o.name)),
    sensors: getUniqueOpts(data.map(o => o.meta.sensor))
  }
}


const getStartTime = (win: Unit) : string => {
  const amount = Number(win.slice(0, -1)) || 1
  const unit = win.charAt(win.length - 1)

  const datetime = new Date()
  if (unit == 'm')
    datetime.setMinutes(datetime.getMinutes() - amount)
  else if (unit == 'h')
    datetime.setHours(datetime.getHours() - amount)
  else if (unit == 'd')
    datetime.setDate(datetime.getDate() - amount)
  else {
    alert(`getStartTime: win (window) not valid.  was window=${win}`)
    return
  }

  return new Date(datetime).toISOString()
}

const getEndTime = (start: string, win: Unit) : string => {
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

const isMedia = (type: DataTypes) =>
  ['images', 'audio'].includes(type)

const isMediaApp = (app: string) =>
  (app || '').match(/image|audio|video|mobotix/g)

const isAudioApp = (app: string) =>
  (app || '').match(/audio/g)

const isSmokeApp = (app: string) =>
  (app || '').match(/smoke/g)


const initMenuState = {
  apps: [],
  tasks: [],
  nodes: [],
  names: [],
  sensors: []
}

const initFilterState = {
  apps: [defaultPlugin],
  tasks: [],
  nodes: [],
  names: [],
  sensors: []
}

const facetList = Object.keys(initFilterState)

type FacetList = keyof typeof initFilterState

type FilterState = {
  [name in FacetList]: string[]
}

type DataTypes = 'apps' | 'images' | 'audio'



export function getFilterState(params, includeDefault=true) : FilterState {
  const init = includeDefault ? initFilterState : {...initFilterState, apps: []}
  for (const [key, val] of params) {
    if (key == 'start')
      continue
    init[key] = val.split(',')
  }

  return init
}



export default function DataPreview() {
  const navigate = useNavigate()

  const params = new URLSearchParams(useLocation().search)
  const app = params.get('apps')
  const name = params.get('names')
  const node = params.get('nodes')
  const sensor = params.get('sensors')
  const task = params.get('tasks')
  const type = params.get('type') as DataTypes || 'apps'                      // for tabs
  const mimeType = isMedia(type) ? params.get('mimeType') as MimeType : null  // for filtering on ext
  const unit = params.get('window') as Unit || 'h'
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
  const [menus, setMenus] = useState<{[name: string]: string[]}>(initMenuState)

  // selected filters
  const [filters, setFilters] = useState<FilterState>(initFilterState)

  // update selected filters whenever url param changes
  useEffect(() => {
    const includeDefault = ['apps'].includes(type)
    const filterState = getFilterState(params, includeDefault)
    setFilters(filterState)
  }, [app, name, node, sensor, task, type])


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
    const plugin = app || (type == 'apps' ? defaultPlugin : null)

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
          ...(plugin ? {plugin} : {}),
          ...(node ? {vsn: node} : {}),
          ...(name ? {name} : {}),
          ...(sensor ? {sensor} : {}),
          ...(task ? {task} : {})
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

          if (task && mimeType) {
            data = data.filter(o => {
              const val = o.value as string
              const ext = val.slice(val.lastIndexOf('.'))
              return exts[mimeType].includes(ext)
            })
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
          setError(error.message)
          setLoading(false)
        })
    }

    fetchAppMenu()
    fetchData()
    fetchFilterMenus()
  }, [
    app, node, name, sensor, task, type, mimeType,
    unit, start, setLoading
  ])


  // relative time and show meta checkbox events
  useEffect(() => {
    setCols(prev => {
      let idx
      if (checked.relativeTime) {
        idx = findColumn(prev, 'timestamp')
        prev[idx] = {...prev[idx], format: (val) => relativeTime(val)}
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
    Array.from(params.keys())
      .forEach(key => params.delete(key))
  }

  const handleOptionCheck = (evt, name) => {
    setChecked(prev => ({...prev, [name]: evt.target.checked}))
  }

  const handleMimeCheck = (evt, name) => {
    if (evt.target.checked)
      params.set('mimeType', name)
    else
      params.delete('mimeType')
    navigate({search: params.toString()}, {replace: true})
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

  const goToTasks = (val: DataTypes, taskQuery: string) => {
    clearParams()
    params.set('type', val)
    params.set('tasks', taskQuery)
    params.set('window', 'h')
    if (val == 'images') params.set('mimeType', 'image')
    navigate({search: params.toString()}, {replace: true})
  }

  const handleTypeChange = (_, val: DataTypes) => {
    if (val == 'images')
      goToTasks(val, 'imagesampler-.*')
    else if (val == 'audio')
      goToTasks(val, 'audiosampler')
    else
      handleRemoveFilters()
  }


  return (
    <Root isMedia={isMediaApp(app)}>
      <div className="flex">
        <Sidebar width="240px" style={{padding: '0 10px'}}>
          <h2 className="filter-title">Filters</h2>

          <div className="shortcuts">
            <ToggleButtonGroup
              color="primary"
              exclusive
              value={type}
              onChange={handleTypeChange}
              aria-label="data type"
              fullWidth
            >
              <ToggleButton value="apps"><AppsIcon fontSize="small"/>&nbsp;Apps</ToggleButton>
              <ToggleButton value="images"><ImageIcon fontSize="small"/>&nbsp;Images</ToggleButton>
              <ToggleButton value="audio"><AudioIcon fontSize="small"/>&nbsp;Audio</ToggleButton>
            </ToggleButtonGroup>
          </div>

          {menus && facetList.map(facet => {
            // if no sensors are associated with the data, don't show sensor input
            if (facet == 'sensors' && !menus[facet].length) {
              return <></>
            }

            // if apps view, ignore tasks
            if (['apps'].includes(type) && ['tasks'].includes(facet)) {
              return <></>
            }

            // if media, ignore names
            if (isMedia(type) && ['apps', 'sensors', 'names'].includes(facet)) {
              return <></>
            }

            const label = capitalize(facet)

            let value = ''
            if (filters[facet]?.length) {
              value = (filters[facet][0] || '').replace(`${registry}/`, '')
            }

            return (
              <Menu
                key={facet}
                options={menus[facet]}
                renderInput={(props) =>
                  <TextField {...props} label={label} />}
                PopperComponent={(props) =>
                  <Popper {...props} style={{width: label == 'Apps' ? 350 : 300, zIndex: 9999}} />}
                value={value}
                onChange={(evt, val) => handleFilterChange(facet, val)}
              />
            )
          })}

          {type == 'images' &&
            <FormControlLabel
              control={
                <Checkbox
                  checked={mimeType == 'image'}
                  onChange={(evt) => handleMimeCheck(evt, 'image')}
                />
              }
              label="only images"
            />
          }

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
                      .filter(k => !['window', 'type'].includes(k))
                      .reduce((acc, k) => ({
                        ...acc,
                        [k]: filters[k].map(s => s.replace(`${registry}/`, ''))
                      }), {})
                  }
                />
              </div>
            </div>
          </div>

          <br />

          {chart &&
            <TimeSeries data={chart} />
          }

          {lastN &&
            <Alert severity="info">
              There are {lastN.total.toLocaleString()} records for this query.
              Listing the most recent {lastN.limit.toLocaleString()} below.
            </Alert>
          }

          {error &&
            <ErrorMsg>{error}</ErrorMsg>
          }

          {data?.length == 0 &&
            <Alert severity="info">No recent data found <b>for the last {units[unit]}</b></Alert>
          }

          {/* todo(nc): here we have to check data.length because of bug
           in table component when pagination is used */}
          {data && data?.length > 0 &&
            <Table
              primaryKey="rowID"
              enableSorting
              columns={cols}
              rows={data}
              pagination
              page={page}
              rowsPerPage={isAudioApp(app) ? 10 : (isMediaApp(app) ? 20 : 100)}
              limit={data.length} // todo(nc): "limit" is fairly confusing
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
                          onChange={(evt) => handleOptionCheck(evt, 'relativeTime')}
                        />
                      }
                      label="relative time"
                    />

                    <FormControlLabel
                      label="meta"
                      control={
                        <Checkbox
                          checked={checked.showMeta}
                          onChange={(evt) => handleOptionCheck(evt, 'showMeta')}
                        />
                      }
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

  .MuiInputBase-root,
  .MuiButtonBase-root:not(.Mui-selected) {
    background: #fff;
  }

  .MuiToggleButtonGroup-grouped:not(:first-of-type) {
    border-left: 1px solid rgba(0, 0, 0, 0.12);
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

