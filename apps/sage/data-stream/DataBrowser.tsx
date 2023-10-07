/* eslint-disable react/display-name */
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import styled from 'styled-components'

import * as BH from '/components/apis/beehive'

import { Sidebar } from '/components/layout/Layout'
import Table from '/components/table/Table'
import Checkbox from '/components/input/Checkbox'
import Clipboard from '/components/utils/Clipboard'
import Audio from '/components/viz/Audio'
import QueryViewer from '/components/QueryViewer'
import TimeSeries from './TimeSeries'
import DateRangePicker from '/components/input/DatetimeRangePicker'
import ErrorMsg from '../ErrorMsg'
import { quickRanges, relativeTime } from '/components/utils/units'
import { useProgress } from '/components/progress/ProgressProvider'
import TimeOpts from '/components/input/StyledTimeOpts'

import {
  FormControlLabel, Button, Divider, Select,
  MenuItem, FormControl, InputLabel, Alert,
  Autocomplete, TextField, Popper, ToggleButtonGroup, ToggleButton, CircularProgress, Tooltip
} from '@mui/material'

import UndoIcon from '@mui/icons-material/UndoRounded'
import DownloadIcon from '@mui/icons-material/CloudDownloadOutlined'
import AppsIcon from '@mui/icons-material/Apps'
import ImageIcon from '@mui/icons-material/ImageOutlined'
import AudioIcon from '@mui/icons-material/Headphones'
import NamesIcon from '@mui/icons-material/CategoryRounded'
import RefreshIcon from '@mui/icons-material/RefreshRounded'
import StopIcon from '@mui/icons-material/StopCircle'

import { capitalize } from 'lodash'

import config from '/config'
const registry = config.dockerRegistry

// default app for initial view of data
const defaultPlugin = '.*plugin-iio.*'

const exts = {
  image: ['.jpg', '.jpeg', '.png', '.gif'],
  audio: ['.flac'],
  video: ['.mp4']
}

type MimeType = keyof typeof exts


const columns = [{
  id: 'vsn',
  label: 'VSN',
  format: (val) => <a href={`/node/${val}`}>{val}</a>
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




type Unit = keyof typeof quickRanges
type RelativeTimeStr =
  `-${string}m` | `-${string}h` | `-${string}d`


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
    .map(v => {
      const path = v.replace(`${registry}`, '')
      const label = path.slice(path.lastIndexOf('/') + 1)
      return {id: v, label}
    })


const getCurlCmd = (query: object) =>
  `curl ${BH.url}/query -d '${JSON.stringify(query)}'`



const indent = 4
const pad = ' '.repeat(indent)

const getArgsStr = (obj: object) =>
  Object.entries(obj).map(([k, v]) => `${k}="${v}"`)
    .join(',\n' + pad) + ', '


const getPythonSnippet = (query: BH.Params)  => {
  const {filter = {}, ...rest} = query || {}

  const params = `\n${pad}${getArgsStr(rest)}`
  const filterParams = JSON.stringify(filter, null, indent).replace(/(.+):/g, pad + '$1:')

  const str =
    `${params}\n` +
    `${pad}filter={${filterParams.slice(1, -1)}${pad}}`

  return (
    `import sage_data_client\n\n` +
    `df = sage_data_client.query(${str}\n)`
  )
}


function getAppMenus() {
  return BH.getData({
    start: `-2h`,
    tail: 1,
    filter: {
      plugin: `.*`
    }
  }).then((data) =>
    getUniqueAppOpts(data.map(o => o.meta.plugin))
  )
}


async function getFilterMenus({plugin, task}) {
  const data = await BH.getData({
    start: `-1d`,
    tail: 1,
    filter: {
      ...(plugin ? {plugin} : {}),
      ...(task ? {task} : {})
    }
  })

  return {
    nodes: getUniqueOpts(data.map(o => o.meta.vsn)),
    names: getUniqueOpts(data.map(o => o.name)),
    sensors: getUniqueOpts(data.map(o => o.meta.sensor)),
    ...(plugin ? {} : {
      tasks: getUniqueOpts(data.map(o => o.meta.task))
    })
  }
}


const getStartTime = (start: DateStr | RelativeTimeStr) : Date => {
  if (isDateStr(start))
    return new Date(start)

  const amount = Number(start.slice(0, -1)) || 1
  const unit = start.charAt(start.length - 1)

  const datetime = new Date()
  if (unit == 'm')
    datetime.setMinutes(datetime.getMinutes() + amount)
  else if (unit == 'h')
    datetime.setHours(datetime.getHours() + amount)
  else if (unit == 'd')
    datetime.setDate(datetime.getDate() + amount)
  else if (unit == 'y')
    datetime.setFullYear(datetime.getFullYear() + amount)
  else {
    alert(`getStartTime: start time not valid.  was start=${start}`)
    return
  }

  return new Date(datetime)
}

const getEndTime = (start: DateStr | RelativeTimeStr, end?: DateStr | RelativeTimeStr) : Date => {
  if (isDateStr(end))
    return new Date(end)
  else if (!end)
    return new Date()

  const amount = Number(end.slice(0, -1)) || 1
  const unit = end.charAt(end.length - 1)

  const startTime = new Date(start)
  const endTime = new Date(start)
  if (unit == 'm')
    endTime.setMinutes(startTime.getMinutes() + amount)
  else if (unit == 'h')
    endTime.setHours(startTime.getHours() + amount)
  else if (unit == 'd')
    endTime.setDate(startTime.getDate() + amount)
  else if (unit == 'y')
    endTime.setFullYear(startTime.getFullYear() + amount)
  else {
    alert(`getEndTime: end time not valid.  was end=${end}`)
    return
  }

  return new Date(endTime)
}

const isMedia = (type: DataTypes) =>
  ['images', 'audio'].includes(type)

const isMediaApp = (app: string) =>
  /image|audio|video|mobotix/g.test(app || '')

const isAudioApp = (app: string) =>
  /audio/g.test(app || '')

const getRowsPerPage = (app: string, type: DataTypes) => {
  if (isAudioApp(app))
    return 10
  else if (isMediaApp(app) || isMedia(type))
    return 20
  else
    return 100
}

const isDateStr = (str: string) => !!Date.parse(str)


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


type Facet = keyof typeof initFilterState

type MenuState = {
  [name in Facet]: string[]
}

type FilterState = {
  [name in Facet]: string[]
}

type DataTypes = 'apps' | 'names' | 'images' | 'audio'

type Facets = {
  [name in DataTypes]: Facet[]
}

type Option = {id: string, label: string}

const facetInputs: Facets = {
  'apps': ['apps', 'nodes', 'names', 'sensors'],
  'names': ['names', 'nodes'],
  'images': ['tasks', 'nodes'],
  'audio': ['tasks', 'nodes']
}

const allowMultiSelect = (field: Facet) =>
  ['nodes', 'names'].includes(field)


export function getFilterState(params, includeDefaultApp=true) : FilterState {
  const init = includeDefaultApp ?
    {...initFilterState} : {...initFilterState, apps: []}
  for (const [key, val] of params) {
    if (key == 'start')
      continue
    init[key] = val.split('|')
  }

  return init
}


type DateStr = `${string}T${string}Z`


export default function DataBrowser() {
  const [params, setParams] = useSearchParams()
  const app = params.get('apps')
  const name = params.get('names')
  const node = params.get('nodes')
  const sensor = params.get('sensors')
  const task = params.get('tasks')
  const type = params.get('type') as DataTypes || 'apps'  // for tabs
  const mimeType = isMedia(type) ?
    params.get('mimeType') as MimeType : null             // for filtering on ext

  const start = (params.get('start') || '-30m') as DateStr | RelativeTimeStr
  const end = params.get('end') as DateStr | RelativeTimeStr

  // update the UI if dates are changed, but not times
  const [timeIsFocused, setTimeIsFocused] = useState<boolean>()
  const [pendingRange, setPendingRange] = useState<[Date, Date]>()
  const [queryCount, setQueryCount] = useState(0)
  const [prevQuery] = useState(params)

  // only update the range when start, end, or 'refresh' is pressed
  const range = useMemo<[Date, Date]>(() =>
    [getStartTime(start), getEndTime(start, end)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  , [start, end, queryCount])

  const {loading, setLoading} = useProgress()
  const [cols, setCols] = useState(columns)
  const [page, setPage] = useState(0)

  const [checked, setChecked] = useState({
    relativeTime: true,
    showMeta: false,
  })

  const [query, setQuery] = useState<BH.Params>()
  const [data, setData] = useState<BH.Record[]>()
  const [error, setError] = useState()
  const [lastN, setLastN] = useState<{total: number, limit: number}>()
  const [chart, setChart] = useState<BH.Record[]>()

  // contents of dropdowns
  const [menus, setMenus] = useState<MenuState>(initMenuState)

  // selected filters
  const [filters, setFilters] = useState<FilterState>(initFilterState)


  // update selected filters whenever url param changes
  useEffect(() => {
    const includeDefaultApp = ['apps'].includes(type)
    const filterState = getFilterState(params, includeDefaultApp)
    setFilters(filterState)
  }, [app, name, node, sensor, task, type, mimeType])


  // update filter menus whenever app or task changes
  useEffect(() => {
    if (!app) return

    getFilterMenus({plugin: app, task})
      .then((menuItems) => setMenus(prev => ({...prev, ...menuItems})))
  }, [app, task])


  // show/hide sensor column if needed
  useEffect(() => {
    if (menus.sensors.length) {
      setCols(prev => {
        const idx = findColumn(prev, 'sensor')
        prev[idx] = {...prev[idx], hide: false}
        return prev.slice(0)
      })
    } else {
      setCols(prev => {
        const idx = findColumn(prev, 'sensor')
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
      if (!plugin && !task)
        return

      getFilterMenus({plugin, task})
        .then((menuItems) => {
          setMenus(prev => ({...prev, ...menuItems}))
        })
    }

    function fetchData() {
      const query = {
        ...(start ? {start} : {}),
        ...(end ? {end} : {}),
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

          // simple charts for plugin-based or ontology listing
          if (
            ['apps', 'names'].includes(type)
            && node && !isMediaApp(app) && data.length > 0
          ) {
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

          // filter image/audio further based on extension if needed
          if (task && mimeType) {
            data = data.filter(o => {
              const val = o.value as string
              const ext = val.slice(val.lastIndexOf('.'))
              return exts[mimeType].includes(ext)
            })
          }

          // flatten data, add row id, and sort
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
    start, end, queryCount, setLoading
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
    setParams(params, {replace: true})
  }


  const handleFilterChange = (field: Facet, val: Option | Option[]) => {
    if (!val || (Array.isArray(val) && !val.length)) {
      params.delete(field)
    } else if (allowMultiSelect(field)) {
      // MUI seems to result in vals may be string or option; todo(nc): address this?
      const newStr = val.map(item =>
        typeof item == 'string' ? item : item.id
      ).join('|')

      params.set(field, newStr)
    } else {
      params.set(field, val.id)
    }

    setParams(params, {replace: true})
  }


  const handleQuickRangeChange = (val) => {
    setPendingRange(null)
    params.delete('end')
    params.set('start', val)
    setParams(params, {replace: true})
  }


  const handleDatePickerFocus = (evt) => {
    const {name} = evt.target
    const isTime = ['hour12', 'minute', 'second', 'mPM'].includes(name)
    setTimeIsFocused(isTime)
  }


  const handleDatePickerChange = ([start, end]) => {
    if (timeIsFocused) {
      setPendingRange([start, end])
    } else {
      handleDateUpdate([start, end])
    }
  }


  const handleDateUpdate = ([start, end]) => {
    params.set('start', new Date(start).toISOString())
    params.set('end',  new Date(end).toISOString())
    setParams(params, {replace: true})
  }


  const handleRemoveFilters = () => {
    clearParams()
    params.set('apps', defaultPlugin)
    setParams(params, {replace: true})
  }


  const goToTasks = (val: DataTypes, taskQuery: string) => {
    clearParams()
    params.set('type', val)
    params.set('tasks', taskQuery)
    params.set('start', '-1h')
    if (val == 'images') params.set('mimeType', 'image')
    setParams(params, {replace: true})
  }


  const goToNames = (val: DataTypes, nameQuery: string) => {
    clearParams()
    params.set('type', val)
    params.set('names', nameQuery)
    params.set('start', '-1h')
    setParams(params, {replace: true})
  }


  const handleTypeChange = (_, val: DataTypes) => {
    if (val == 'names') {
      goToNames(val, 'env.temperature')
    } else if (val == 'images')
      goToTasks(val, 'imagesampler-.*')
    else if (val == 'audio')
      goToTasks(val, 'audiosampler')
    else
      handleRemoveFilters()
  }


  const handleQueryViewerChange = (field: string, next: string[]) => {
    if (!next.length) params.delete(field)
    else params.set(field, next.join('|'))
    setParams(params, {replace: true})
  }


  const handleRefresh = () => {
    if (loading) {
      setParams(prevQuery, {replace: true})
    } else if (pendingRange) {
      handleDateUpdate(pendingRange)
      setPendingRange(null)
    } else {
      setQueryCount(prev => prev + 1)
    }
  }


  return (
    <Root isMedia={isMediaApp(app) || isMedia(type)}>
      <div className="flex">
        <Sidebar width="240px" style={{padding: '25px 10px 10px 10px'}}>

          <div className="shortcuts">
            <ToggleButtonGroup
              color="primary"
              exclusive
              value={type}
              onChange={handleTypeChange}
              aria-label="data type"
              orientation="vertical"
              fullWidth
            >
              <ToggleButton value="apps" className="flex justify-start gap">
                <AppsIcon /> Apps <div className="help-text self-end">Query by ECR application</div>
              </ToggleButton>
              <ToggleButton value="names" className="flex justify-start gap">
                <NamesIcon /> Names <div className="help-text self-end">Query by measurement name</div>
              </ToggleButton>
              <ToggleButton value="images" className="flex justify-start gap">
                <ImageIcon /> Images <div className="help-text self-end">Query for image samples</div>
              </ToggleButton>
              <ToggleButton value="audio" className="flex justify-start gap">
                <AudioIcon /> Audio <div className="help-text self-end">Query for audio samples</div>
              </ToggleButton>
            </ToggleButtonGroup>
          </div>

          <h3>{capitalize(type.replace(/s$/, ''))} Filters</h3>

          {menus && facetInputs[type].map(facet => {
            // if no sensors are associated with the data, don't show sensor input
            if (facet == 'sensors' && !menus[facet].length) {
              return <></>
            }

            const label = capitalize(facet)

            const allowMultiple = allowMultiSelect(facet)

            let value = allowMultiple ? [] : ''
            if (allowMultiple && filters[facet]?.length)
              value = filters[facet]
            else if (facet == 'apps' && filters[facet]?.length)
              value = (filters[facet][0] || '').replace(`${registry}/`, '')
            else if (filters[facet]?.length)
              value = filters[facet][0]

            return (
              <Menu key={facet}>
                <Autocomplete
                  options={menus[facet]}
                  renderInput={(props) =>
                    <TextField {...props} label={label} />}
                  PopperComponent={(props) =>
                    <Popper {...props} style={{width: label == 'Apps' ? 350 : 300, zIndex: 9999}} />}
                  value={value}
                  onChange={(evt, val) => handleFilterChange(facet, val)}
                  disableCloseOnSelect={allowMultiple}
                  multiple={allowMultiple}
                  isOptionEqualToValue={(opt, val) => val ? opt.id == val : false}
                  limitTags={4}
                />
              </Menu>
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
              label=".jpg, .png, etc."
            />
          }

          <Snippets>
            <div>
              <h4>cURL download</h4>
              <Clipboard
                content={getCurlCmd(query)}
                tooltip="Copy curl CMD"
              />
            </div>

            <div>
              <h4>Python snippet</h4>
              <Clipboard
                content={getPythonSnippet(query)}
                tooltip="Copy python snippet"
              />
              <div className="flex justify-between text-xs">
                <a href="https://pypi.org/project/sage-data-client/"
                  target="_blank" rel="noreferrer">install client</a>
                <a href={`${config.docs}/tutorials/accessing-data`}
                  target="_blank" rel="noreferrer">docs</a>
              </div>
            </div>
          </Snippets>
        </Sidebar>

        <Main>
          <div className="flex items-start justify-between">
            <div className="flex items-start query-viewer">
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
                    .filter(k => !['start', 'end', 'type'].includes(k))
                    .reduce((acc, k) => ({
                      ...acc,
                      [k]: filters[k].map(s => s.replace(`${registry}/`, ''))
                    }), {})
                }
                onDelete={handleQueryViewerChange}
                disableDelete={{field: 'apps', filter: defaultPlugin}}
                scroll
              />
            </div>

            <TimeOpts>
              <FormControl variant="outlined" style={{width: 150}}>
                <InputLabel id="range-label">Quick Ranges</InputLabel>
                <Select
                  labelId="range-label"
                  id="range"
                  value={isDateStr(start) ? 'custom' : start}
                  onChange={evt => handleQuickRangeChange(evt.target.value)}
                  label="Quick Ranges"
                  margin="dense"
                >
                  {(isDateStr(start) ? Object.keys(quickRanges) : Object.keys(quickRanges).slice(1))
                    .map(k =>
                      <MenuItem value={k} key={k}>{quickRanges[k]}</MenuItem>
                    )
                  }
                </Select>
              </FormControl>
              <DateRangePicker
                value={pendingRange || range}
                onChange={handleDatePickerChange}
                onFocus={handleDatePickerFocus}
              />
              <Tooltip title={
                loading ? 'Cancel' : (pendingRange ? 'Submit' : 'Refresh')}
              >
                <Button
                  variant={pendingRange ? 'contained' : 'outlined'}
                  color={pendingRange ? 'success' : 'info'}
                  onClick={handleRefresh}
                >
                  {loading ?
                    <>
                      <CircularProgress size={25}/>
                      <StopIcon color="action" />
                    </> :
                    (pendingRange ?
                      'Go' :
                      <RefreshIcon color="action" sx={pendingRange && {color: '#f2f2f2'}} />
                    )
                  }
                </Button>
              </Tooltip>
            </TimeOpts>
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
            <Alert severity="info">No recent data found for the selected period.</Alert>
          }

          {/* todo(nc): here we have to check data.length because of bug
           in table component when pagination is used */}
          {data && data?.length > 0 &&
            <Table
              primaryKey="rowID"
              enableSorting
              sort="-timestamp"
              columns={cols}
              rows={data}
              pagination
              page={page}
              rowsPerPage={getRowsPerPage(app, type)}
              limit={data.length} // todo(nc): "limit" is fairly confusing
              emptyNotice={
                <span className="flex">
                  <span>No records found from the selected period</span>
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
              middleComponent={<></>}
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
    .help-text {
      display: none;
      font-size: .8em;
      line-height: 1em;
    }

    button:hover .help-text {
      display: block;
    }
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
    `}

  .query-viewer {
    overflow: hidden;
  }
`

const Main = styled.div`
  position: relative;
  height: 100%;
  margin: 30px 20px 30px 0;
  padding: 0 0 0 20px;
  width: calc(100% - 240px - 20px);

  tr.MuiTableRow-root:hover,
  .MuiTableRow-hover:hover  {
    background-color: none !important;
  }

  .MuiAlert-root {
    margin-bottom: 1em;
  }
`

const Menu = styled.div`
  margin-bottom: 15px;
  background: #fff;
`

const Snippets = styled.div`
  margin: 40px 0 100px 0;

  > div { margin: 0 0 30px 0; }
  h4 { margin: 2px 0; }

  pre {
    margin: 0;
    border: none;
    background: #fff !important;
  }
`
