import { useEffect, useState, useRef, useCallback, useReducer } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import Checkbox from '/components/input/Checkbox'

import TimelineSkeleton from './TimelineSkeleton'
import {Top} from '../common/Layout'
import Sidebar, {FilterTitle} from '../data-commons/DataSidebar'
import Filter from '../common/FacetFilter'
import ErrorMsg from '../ErrorMsg'

import { useProgress } from '/components/progress/ProgressProvider'
import TimelineChart, {colors} from '/components/viz/TimelineChart'
import * as BK from '/components/apis/beekeeper'
import * as BH from '/components/apis/beehive'
import * as ECR from '/components/apis/ecr'
// import {fetchMockRollup} from './fetchMockRollup'

import { chain, groupBy, startCase, intersection, sum, memoize } from 'lodash'
import { endOfHour, subDays } from 'date-fns'
import { hourlyToDailyRollup } from './rollupUtils'


// No assignment represents null, and is same as empty string in this view
const NO_ASSIGNMENT = 'None'
const TIME_WINDOW = 'hour'

const TIMELINE_MARGIN = {left: 175, right: 20, bottom: 0}
const ITEMS_INITIALLY = 10
const ITEMS_PER_PAGE = 5


type FetchRollupProps = {
  byVersion?: boolean
  groupName?: string
  time?: 'hourly' | 'daily'
}


const fetchRollup = memoize(function(props: FetchRollupProps = {}) {
  return BH.getPluginCounts()
    .then(d => {
      const data = parseData({data: d, ...props})
      return {rawData: d, data}
    })
})


type ParseDataProps = {data: BH.Record[]} & FetchRollupProps

function parseData(props: ParseDataProps) {
  const {
    data,
    byVersion = false,
    groupName = 'meta.vsn',
    time = 'hourly'
  } = props

  const d = data.map(o => {
    const { plugin } = o.meta
    return {
      ...o,
      meta: {
        ...o.meta,
        plugin: byVersion ? plugin : plugin.split(':')[0]
      }
    }
  })

  const hourlyByVsn = groupBy(d, groupName)

  if (time == 'hourly') {
    const hourly = Object.keys(hourlyByVsn).reduce((acc, vsn) => ({
      ...acc,
      [vsn]: groupBy(hourlyByVsn[vsn], 'meta.plugin')
    }), {})

    return hourly
  } else if (time == 'daily') {
    return hourlyToDailyRollup(hourlyByVsn)
  }

  throw `parseData: grain='${grain}' not valid`
}


function getMockByApp(data) {
  let byApp = groupBy(data, 'meta.plugin')
  const byAppByPlugin = Object.keys(byApp)
    .reduce((acc, app) => ({...acc, [app]: groupBy(byApp[app], 'meta.vsn')}), {})

  return byAppByPlugin
}


const getFacets = (data, name) =>
  chain(data)
    .countBy(name)
    .map((count, name) => ({name: name.length ? name : NO_ASSIGNMENT, count}))
    .value()


// core logic for intersection of unions; could be optimized or simplified if needed
const getFilteredVSNs = (manifests: BK.Manifest[], data, filters: Filters) => {
  const vsnsByField = {}
  for (const [field, vals] of Object.entries(filters)) {
    for (const manifest of manifests) {
      if (!vals.includes(manifest[field]))
        continue

      const vsn = manifest.vsn
      vsnsByField[field] = field in vsnsByField ?
        [...vsnsByField[field], vsn] : [vsn]
    }
  }

  const count = sum(Object.values(vsnsByField).map(vals => vals.length))

  let vsns = count ?
    intersection(...Object.values(vsnsByField)) : manifests.map(m => m.vsn)

  // find intersection of vsns and data vsns
  let vsnSubset = Object.keys(data)
    .filter(vsn => vsns.includes(vsn))

  vsnSubset = sortVSNs(vsnSubset)
  return vsnSubset
}


// sort by node, then blade
const sortVSNs = (vsns: string[]) => ([
  ...vsns.filter(vsn => vsn.charAt(0) == 'W').sort(),
  ...vsns.filter(vsn => vsn.charAt(0) == 'V').sort()
])



const getSubTitle = (nodes, apps) =>
  nodes ?
    `${nodes.length} nodes with data` :
  apps ?
    `${apps.length} apps with data` : ''


const stdColor = (val) =>
  val == null ? colors.noValue : colors.blues[4]


const colorDensity = (val, obj) => {
  if (val == null)
    return colors.noValue

  if (val == 1)
    return colors.blues[1]
  if (val <= 10)
    return colors.blues[2]
  else if (val <= 100)
    return colors.blues[3]
  else if (val <= 1000)
    return colors.blues[4]
  else if (val <= 5000)
    return colors.blues[5]
  else
    return colors.blues[6]
}

const getInfiniteEnd = (page: number) =>
  page == 1 ? ITEMS_INITIALLY : page * ITEMS_PER_PAGE


// todo(nc): temp solution until we have references!
// use the most recent app with same substring, ignoring "plugin-" and version
const findApp = (apps, name) =>
  apps.find(o => o.id.includes(name.replace('plugin-', '')))



type Filters = {
  [name: string]: string[]
}

type FacetItem = {name: string, count: number}

type Facets = {
  [name: string]: {title: string, items: FacetItem[] }
}

const initFilterState = {
  'project': [],
  'focus': [],
  'location': [],
  'vsn': []
}

const initDataState = {
  rawData: null,
  data: null,
  filtered: [],
  filters: initFilterState
}

function dataReducer(state, action) {
  // todo(nc): note: we likely won't need both ADD_FILTER and RM_FILTER?
  switch (action.type) {
    case 'INIT_DATA': {
      return {
        ...state,
        rawData: action.data.rawData,
        data: action.data.data,
        filtered: sortVSNs(Object.keys(action.data.data)),
      }
    }
    case 'SET_DATA': {
      return {
        ...state,
        data: action.data,
      }
    }
    case 'ADD_FILTER': {
      const {data, filters} = state
      const {manifests, facet, val} = action

      // new filter state
      const newFilters = {
        ...filters,
        [facet]: [...filters[facet], val]
      }

      // new filtered data, using "manifest" data
      const filtered = getFilteredVSNs(manifests, data, newFilters)

      return {
        ...state,
        filtered,
        filters: newFilters
      }
    }
    case 'RM_FILTER': {
      const {data, filters} = state
      const {manifests, facet, val} = action

      // new filter state
      const newFilters = {
        ...filters,
        [facet]: filters[facet].filter(v => v != val)
      }

      // new filtered data, using "manifest" data
      const filtered = getFilteredVSNs(manifests, data, newFilters)

      return {
        ...state,
        filtered,
        filters: newFilters
      }
    }
    case 'SELECT_ALL': {
      const {data, filters} = state
      const {manifests, facet, vals} = action

      const newFilters = {...filters, [facet]: vals}
      const filtered = getFilteredVSNs(manifests, data, newFilters)

      return {
        ...state,
        filtered,
        filters: newFilters
      }
    }
    case 'CLEAR_CATEGORY': {
      const {data, filters} = state
      const {manifests, facet} = action

      const newFilters = {...filters, [facet]: []}
      const filtered = getFilteredVSNs(manifests, data, newFilters)

      return {
        ...state,
        filtered,
        filters: newFilters
      }
    }
    case 'ERROR': {
      return ({
        ...state,
        error: action.error
      })
    }
    default: {
      return state
    }
  }
}

type Options = {
  density: boolean
  versions: boolean
  time: 'hourly' | 'daily'
}


const facetList = Object.keys(initFilterState)


export default function Data() {
  const navigate = useNavigate()

  const [manifestByVSN, setManifestByVSN] = useState<{[vsn: string]: BK.Manifest}>()
  const [manifests, setManifests] = useState<BK.Manifest[]>()
  const [ecr, setECR] = useState<BK.Manifest[]>()

  // infinite scroll
  const [page, setPage] = useState(1)
  const loader = useRef(null)
  const [loadingMore, setLoadingMore] = useState(false)

  // main data views
  const {loading, setLoading} = useProgress()
  const [{data, filtered, filters, rawData, error}, dispatch] = useReducer(
    dataReducer,
    initDataState,
  )

  const [byApp, setByApp] = useState()
  const [apps, setApps] = useState<string[]>()

  const [facets, setFacets] = useState<Facets>(null)

  // options
  const [display, setDisplay] = useState<'nodes' | 'apps'>('nodes')
  const [opts, setOpts] = useState<Options>({
    density: false,
    versions: false,
    time: 'hourly'
  })


  useEffect(() => {
    setLoading(true)
    const mProm = BK.getManifest({by: 'vsn'})
      .then(data => {
        setManifestByVSN(data) // todo(nc): remove
        setManifests(Object.values(data))

        const projects = getFacets(data, 'project')
        const focuses = getFacets(data, 'focus')
        const locations = getFacets(data, 'location')
        const vsns = getFacets(data, 'vsn')

        console.log('data', data)

        setFacets({
          project: {title: 'Project', items: projects},
          focus: {title: 'Focus', items: focuses},
          location: {title: 'Location', items: locations},
          vsn: {title: 'Node', items: vsns}
        })
      }).catch(error => dispatch({type: 'ERROR', error}))

    const dProm = fetchRollup()
      .then(data => {
        dispatch({type: 'INIT_DATA', data})
      })
      .catch(err => error => dispatch({type: 'ERROR', error}))

    Promise.all([mProm, dProm])
      .finally(() => setLoading(false))

    // temp solution for ECR app links
    ECR.listApps('public')
      .then(apps => setECR(apps))
  }, [])


  useEffect(() => {
    // temp solution for ECR app links
    ECR.listApps('public')
      .then(ecr => setECR(ecr))
  }, [])


  const handleObserver = useCallback((entries) => {
    const target = entries[0]
    if (!target.isIntersecting) return

    setLoadingMore(true)
    setTimeout(() => {
      setPage(prev => prev + 1)
    })
  }, [])


  useEffect(() => {
    const option = {
      root: null,
      rootMargin: '100px',
      threshold: 0
    }
    const observer = new IntersectionObserver(handleObserver, option)
    if (loader.current) observer.observe(loader.current)
  }, [handleObserver])


  const handleSetDisplay = (val) => {
    if (!rawData) return

    if (val == 'apps') {
      const mockByApp = getMockByApp(rawData)

      setPage(1)
      setLoadingMore(true) // show skeletons

      setTimeout(() => {
        setByApp(mockByApp)
        setApps(Object.keys(mockByApp))
      })
    }

    setDisplay(val)
  }

  const handleFilter = (evt, facet: string, val: string) => {
    const checked = evt.target.checked
    if (checked) dispatch({type: 'ADD_FILTER', manifests, facet, val})
    else dispatch({type: 'RM_FILTER', manifests, facet, val})
  }

  const handleSelectAll = (evt, facet: string, vals: string[]) => {
    const checked = evt.target.checked
    if (checked) dispatch({type: 'SELECT_ALL', manifests, facet, vals})
    else dispatch({type: 'CLEAR_CATEGORY', manifests, facet})
  }


  const handleOptionChange = (evt, name) => {
    if (name == 'time') {
      const time = evt.target.value
      const data = parseData({data: rawData, time})
      dispatch({type: 'SET_DATA', data})
      setOpts(prev => ({...prev, [name]: time}))
      return
    } else if (name == 'versions') {
      const byVersion = evt.target.checked
      const data = parseData({data: rawData, time: opts.time, byVersion})
      dispatch({type: 'SET_DATA', data})
      setOpts(prev => ({...prev, [name]: byVersion}))
      return
    }

    setOpts(prev => ({...prev, [name]: evt.target.checked}))
  }


  return (
    <Root className="flex">
      <Sidebar width="260px" style={{padding: '10px 0 100px 0'}}>
        <FilterTitle>Filters</FilterTitle>
        {facets && facetList.map(facet => {
          const {title, items} = facets[facet]

          return (
            <Filter
              key={title}
              title={startCase(title.replace('res_', ''))}
              checked={filters[facet]}
              onCheck={(evt, val) => handleFilter(evt, facet, val)}
              onSelectAll={(evt, vals) => handleSelectAll(evt, facet, vals)}
              type="text"
              data={items}
            />
          );
        })}
      </Sidebar>
      <Main>
        <Top>
          <Controls className="flex items-center">
            <div className="flex column">
              <h2 className="title no-margin">Explore Data</h2>
              <h5 className="subtitle no-margin muted">{getSubTitle(filtered, apps)}</h5>
            </div>

            <Divider orientation="vertical" flexItem style={{margin: '0px 20px'}} />

            <div className="flex">
              <div>
                <h5 className="subtitle no-margin muted">Group by</h5>
                <ToggleButtonGroup
                  value={display}
                  onChange={(evt, val) => handleSetDisplay(val)}
                  aria-label="group by"
                  exclusive
                >
                  <ToggleButton value="nodes" aria-label="nodes">
                    Nodes
                  </ToggleButton>
                  <ToggleButton value="apps" aria-label="apps">
                    Apps
                  </ToggleButton>
                </ToggleButtonGroup>
              </div>

              <div>
                <h5 className="subtitle no-margin muted">Time</h5>
                <ToggleButtonGroup
                  value={opts.time}
                  onChange={(evt) => handleOptionChange(evt, 'time')}
                  aria-label="change time (windows)"
                  exclusive
                >
                  <ToggleButton value="hourly" aria-label="hourly">
                    hourly
                  </ToggleButton>
                  <ToggleButton value="daily" aria-label="daily">
                    daily
                  </ToggleButton>
                </ToggleButtonGroup>
              </div>

              <div className="checkboxes">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={opts.versions}
                      onChange={(evt) => handleOptionChange(evt, 'versions')}
                    />
                  }
                  label="versions"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={opts.density}
                      onChange={(evt) => handleOptionChange(evt, 'density')}
                    />
                  }
                  label="density"
                />
              </div>

            </div>
          </Controls>
        </Top>

        <Items>
          {display == 'nodes' && filtered && manifestByVSN &&
            filtered
              .slice(0, getInfiniteEnd(page))
              .map(vsn => {
                const timelineData = data[vsn]

                return (
                  <TimelineContainer key={vsn}>
                    <h2>
                      <Link to={`/node/${manifestByVSN[vsn].node_id}`}>{vsn}</Link>
                    </h2>
                    <TimelineChart
                      data={timelineData}
                      cellUnit={opts.time == 'daily' ? 'day' : 'hour'}
                      colorCell={opts.density ? colorDensity : stdColor}
                      startTime={subDays(new Date(), 30)}
                      endTime={endOfHour(new Date())}
                      tooltip={(item) => `
                        <div style="margin-bottom: 5px;">
                          ${new Date(item.timestamp).toDateString()} ${new Date(item.timestamp).toLocaleTimeString([], {timeStyle: 'short'})} (${TIME_WINDOW})
                        </div>
                        ${item.meta.plugin}<br>
                        ${item.value.toLocaleString()} records`
                      }
                      onRowClick={(name) => {
                        const app = findApp(ecr, name)
                        navigate(`/apps/app/${app.id.split(':')[0]}`)
                      }}
                      onCellClick={(data) => {
                        const {timestamp, meta} = data
                        const {vsn, plugin} = meta
                        const win = opts.time == 'daily' ? 'd' : 'h'
                        window.open(`${window.location.origin}/data-browser?nodes=${vsn}&apps=${plugin}.*&start=${timestamp}&window=${win}`, '_blank')
                      }}
                      margin={TIMELINE_MARGIN}
                    />
                  </TimelineContainer>
                )
              })
          }

          {display == 'apps' && apps && byApp &&
            apps
              .slice(0, getInfiniteEnd(page))
              .map(name => {
                const timelineData = byApp[name]
                return (
                  <TimelineContainer key={name}>
                    <h2>{name}</h2>
                    <TimelineChart
                      data={timelineData}
                      limitRowCount={10}
                      cellUnit={opts.time == 'daily' ? 'day' : 'hour'}
                      colorCell={opts.density ? colorDensity : stdColor}
                      startTime={subDays(new Date(), 30)}
                      endTime={endOfHour(new Date())}
                      tooltip={(item) =>
                        `
                        <div style="margin-bottom: 5px;">
                          ${new Date(item.timestamp).toDateString()} ${new Date(item.timestamp).toLocaleTimeString([], {timeStyle: 'short'})} (${TIME_WINDOW})
                        </div>
                        ${item.meta.plugin}<br>
                        ${item.value.toLocaleString()} records`
                      }
                      onRowClick={(val, data) => {
                        const {meta} = data[0]
                        const {node} = meta
                        navigate(`/node/${node.toUpperCase()}`)
                      }}
                      onCellClick={(data) => {
                        const {timestamp, meta} = data
                        const {vsn, plugin} = meta
                        const win = opts.time == 'daily' ? 'd' : 'h'
                        window.open(`${window.location.origin}/data-browser?nodes=${vsn}&apps=${plugin}.*&start=${timestamp}&window=${win}`, '_blank')
                      }}
                      margin={TIMELINE_MARGIN}
                    />
                  </TimelineContainer>
                )
              })
          }
        </Items>

        {error &&
          <ErrorMsg>{error.message}</ErrorMsg>
        }

        {(loading || loadingMore) && (data ? getInfiniteEnd(page) < data?.length : true) &&
          [...Array(ITEMS_INITIALLY)]
            .map((_, i) =>
              <TimelineSkeleton key={i} />
            )
        }

        {loadingMore && (data ? getInfiniteEnd(page) < data?.length : true) &&
          <LoadingMore className="flex items-center muted">
            <div>loading...</div>
          </LoadingMore>
        }

        <div ref={loader} />
      </Main>
    </Root>
  )
}

const Root = styled.div`
  .MuiCheckbox-root:not(.Mui-checked) span,
  .MuiTextField-root {
    background: #fff;
  }
`

const Main = styled.div`
  margin: 0px 20px 30px 0;
  padding: 0 0 0 20px;
  width: 100%;
`

const Controls = styled.div`
  background-color: #fff;
  padding: 10px 0;
  border-bottom: 1px solid #ddd;

  [role=group] {
    margin-right: 10px;
  }

  .MuiToggleButtonGroup-root {
    height: 25px;
  }

  .checkboxes {
    margin: 17px 10px 0 10px;
  }
`

const TimelineContainer = styled.div`
  margin-bottom: 100px;

  h2 {
    float: left;
    margin: 0 0 0 20px;
  }
`

const Items = styled.div`
  margin-top: 40px;
`

const LoadingMore = styled.div`
  font-size: 2em;
`
