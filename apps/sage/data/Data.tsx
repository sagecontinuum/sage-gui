import { useEffect, useState, useRef, useCallback, useReducer } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import Button from '@mui/material/Button'
import FileDownloadRounded from '@mui/icons-material/FileDownloadRounded'

import DataOptions from './DataOptions'
import { Sidebar, Top, Controls, Divider, FilterTitle } from '/components/layout/Layout'
import Filter from '../common/FacetFilter'
import ErrorMsg from '../ErrorMsg'

import TimelineChart, {colors} from '/components/viz/Timeline'
import TimelineSkeleton from '/components/viz/TimelineSkeleton'
import AppLabel from '/components/viz/TimelineAppLabel'
import { useProgress } from '/components/progress/ProgressProvider'
import * as BK from '/components/apis/beekeeper'
import * as ECR from '/components/apis/ecr'

import { chain, startCase } from 'lodash'
import { addDays, addHours, endOfHour, subDays } from 'date-fns'
import { fetchRollup, parseData } from './rollupUtils'
import { initFilterState, initDataState, dataReducer } from './dataReducer'

import settings from '/components/settings'

// optional project config
const DATA_START = settings.dataStart
const DATA_END = settings.dataEnd
const DATA_PRODUCT_PATH = settings.dataProductPath

// No assignment represents null, and is same as empty string in this view
export const NO_ASSIGNMENT = 'Unassigned'
const TIME_WINDOW = 'hour'

const TIMELINE_LABEL_WIDTH = 175
const ITEMS_INITIALLY = 10
const ITEMS_PER_PAGE = 5

const DAYS = 7



const getFacets = (data, name) =>
  chain(data)
    .countBy(name)
    .map((count, name) => ({name: name.length ? name : NO_ASSIGNMENT, count}))
    .value()


export const stdColor = (val) =>
  val == null ? colors.noValue : colors.blues[4]


export const colorDensity = (val, obj) => {
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

const getDownloadLink = (path) =>
  <Button
    startIcon={<FileDownloadRounded />}
    to={path}
    variant="outlined"
    component={Link}
  >
    Download
  </Button>


// todo(nc): temp solution until we have references!
// use the most recent app with same substring, ignoring "plugin-" and version
const findApp = (apps, name) =>
  apps.find(o => o.id.includes(name.replace('plugin-', '')))


type FacetItem = {name: string, count: number}

type Facets = {
  [name: string]: {title: string, items: FacetItem[], hide?: boolean}
}

export type Options = {
  display: 'nodes' | 'apps'
  time: 'hourly' | 'daily'
  density: boolean
  versions: boolean
  start: Date
  window: `-${number}d`
}


type Props = {
  project?: string
  focus?: string
  nodes?: BK.VSN[]
}

export default function Data(props: Props) {
  // alter init data state if project/focus is provided
  const {project, focus, nodes} = props

  if (project) initDataState.filters.project = [project]
  if (focus) initDataState.filters.focus = [focus]

  const navigate = useNavigate()

  const [nodeMetaByVSN, setNodeMetaByVSN] = useState<{[vsn: string]: BK.NodeMeta}>()
  const [nodeMetas, setNodeMetas] = useState<BK.NodeMeta[]>()
  const [ecr, setECR] = useState<ECR.App[]>()

  // infinite scroll
  const [page, setPage] = useState(1)
  const loader = useRef(null)
  const [loadingMore, setLoadingMore] = useState(false)

  // main data views
  const {loading, setLoading} = useProgress()
  const [{data, filtered, filters, rawData, byApp, error}, dispatch] = useReducer(
    dataReducer,
    initDataState
  )

  const facetList = Object.keys(initFilterState)
  const [facets, setFacets] = useState<Facets>(null)

  // options
  const [opts, setOpts] = useState<Options>({
    display: 'nodes',
    density: true,
    versions: false,
    time: 'hourly',
    start: DATA_START || subDays(new Date(), DAYS)
  })

  // note: endtime is not currently an option
  const [end, setEnd] = useState<Date>(DATA_END || endOfHour(new Date()))

  useEffect(() => {
    setLoading(true)
    const mProm = BK.getNodeMeta({project, focus, nodes})
      .then(data => {
        setNodeMetaByVSN(data) // todo(nc): remove

        const nodeMetas = Object.values(data)


        setNodeMetas(nodeMetas)

        const projects = getFacets(nodeMetas, 'project')
        const focuses = getFacets(nodeMetas, 'focus')
        const locations = getFacets(nodeMetas, 'location')
        const vsns = getFacets(nodeMetas, 'vsn')

        setFacets({
          project: {title: 'Project', items: projects, hide: !!project},
          focus: {title: 'Focus', items: focuses, hide: !!focus},
          location: {title: 'Location', items: locations},
          vsn: {title: 'Node', items: vsns}
        })

        return nodeMetas
      }).catch(error => dispatch({type: 'ERROR', error}))

    const dProm = fetchRollup({...opts, end: DATA_END || addDays(opts.start, DAYS)})

    Promise.all([mProm, dProm])
      .then(([nodeMetas, data]) => dispatch({type: 'INIT_DATA', data, nodeMetas}))
      .catch(error => dispatch({type: 'ERROR', error}))
      .finally(() => setLoading(false))

  }, [opts.start])


  // fetch public ECR apps to determine if apps are indeed public
  useEffect(() => {
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


  const handleFilter = (evt, facet: string, val: string) => {
    const checked = evt.target.checked
    if (checked) dispatch({type: 'ADD_FILTER', nodeMetas, facet, val})
    else dispatch({type: 'RM_FILTER', nodeMetas, facet, val})
  }


  const handleSelectAll = (evt, facet: string, vals: string[]) => {
    const checked = evt.target.checked
    if (checked) dispatch({type: 'SELECT_ALL', nodeMetas, facet, vals})
    else dispatch({type: 'CLEAR_CATEGORY', nodeMetas, facet})
  }

  // todo(nc): refactor into provider
  const handleOptionChange = (evt, name) => {
    if (['nodes', 'apps'].includes(name)) {
      setPage(1) // reset page
      setOpts(prev => ({...prev, display: name}))
      return
    } else  if (name == 'time') {
      const time = evt.target.value
      const data = parseData({data: rawData, time})
      dispatch({type: 'SET_DATA', data})
      setOpts(prev => ({...prev, [name]: time}))
      return
    } else if (name == 'versions') {
      const versions = evt.target.checked
      const data = parseData({data: rawData, time: opts.time, versions})
      dispatch({type: 'SET_DATA', data})
      setOpts(prev => ({...prev, [name]: versions}))
      return
    } else if (name == 'density') {
      setOpts(prev => ({...prev, [name]: evt.target.checked}))
    } else {
      throw `unhandled option state change name=${name}`
    }
  }


  const handleDateChange = (start: Date) => {
    setOpts(prev => ({...prev, start}))
    setEnd(DATA_END || addDays(start, DAYS))
  }


  return (
    <Root className="flex">
      <Sidebar width="250px" style={{padding: '10px 0 100px 0'}}>
        <FilterTitle>Filters</FilterTitle>
        {facets && facetList.map(facet => {
          const {title, items, hide} = facets[facet]

          if (hide) return <div key={title}></div>

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
          )
        })}
      </Sidebar>

      <Main>
        <Top>
          <Controls className="flex items-center">
            <div className="flex column">
              <h2 className="title no-margin">Explore Data</h2>
              <h5 className="subtitle no-margin muted">
                {opts.display == 'nodes' &&
                  `${filtered.length} nodes with recent data`
                }
                {opts.display == 'apps' && byApp &&
                  `${Object.keys(byApp).length} apps with data`
                }
              </h5>
            </div>

            <Divider />

            <DataOptions
              onChange={handleOptionChange}
              onDateChange={handleDateChange}
              opts={opts}
              aggregation
              density
            />
          </Controls>
        </Top>

        <Items>
          {opts.display == 'nodes' && filtered && nodeMetaByVSN && ecr &&
            filtered
              .slice(0, getInfiniteEnd(page))
              .map(vsn => {
                const timelineData = data[vsn]
                const {location} = nodeMetaByVSN[vsn]

                return (
                  <TimelineContainer key={vsn}>
                    <div className="flex justify-between title-row">
                      <div className="flex column">
                        <div>
                          <h2><Link to={`/node/${vsn}`}>{vsn}</Link></h2>
                        </div>
                        <div>{location}</div>
                      </div>

                      {DATA_PRODUCT_PATH &&
                        <div className="data-opts">
                          {getDownloadLink(DATA_PRODUCT_PATH)}
                        </div>
                      }
                    </div>
                    <TimelineChart
                      data={timelineData}
                      cellUnit={opts.time == 'daily' ? 'day' : 'hour'}
                      colorCell={opts.density ? colorDensity : stdColor}
                      startTime={opts.start}
                      endTime={end}
                      tooltip={(item) => `
                        <div style="margin-bottom: 5px;">
                          ${new Date(item.timestamp).toDateString()}${' '}
                          ${new Date(item.timestamp).toLocaleTimeString([], {timeStyle: 'short'})}${' '}
                          (${TIME_WINDOW})
                        </div>
                        ${item.meta.plugin}<br>
                        ${item.value.toLocaleString()} records`
                      }
                      onRowClick={(name) => {
                        const id = findApp(ecr, name).id.split(':')[0]
                        const origin = window.location.origin
                        const portal = 'https://portal.sagecontinuum.org'

                        if (origin == portal)
                          navigate(`/apps/app/${id}`)
                        else
                          window.open(`${portal}/apps/app/${id}`, '_blank')
                      }}
                      onCellClick={(data) => {
                        const {timestamp, meta} = data
                        const {vsn, origPluginName} = meta
                        const date = new Date(timestamp)
                        const end = (opts.time == 'daily' ? addDays(date, 1) : addHours(date, 1)).toISOString()
                        window.open(
                          `${window.location.origin}/query-browser` +
                          `?nodes=${vsn}&apps=${origPluginName}.*&start=${timestamp}&end=${end}`,
                          '_blank'
                        )
                      }}
                      yFormat={(label) => <AppLabel label={label} ecr={ecr} />}
                      labelWidth={TIMELINE_LABEL_WIDTH}
                    />
                  </TimelineContainer>
                )
              })
          }

          {opts.display == 'apps' && byApp &&
            Object.keys(byApp)
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
                      startTime={opts.start}
                      endTime={end}
                      tooltip={(item) =>
                        `
                        <div style="margin-bottom: 5px;">
                          ${new Date(item.timestamp).toDateString()}${' '}
                          ${new Date(item.timestamp).toLocaleTimeString([], {timeStyle: 'short'})}${' '}
                          (${TIME_WINDOW})
                        </div>
                        ${item.meta.plugin}<br>
                        ${item.value.toLocaleString()} records`
                      }
                      yFormat={vsn => <Link to={`/node/${vsn}`} target="_blank">{vsn}</Link>}
                      onCellClick={(data) => {
                        const {timestamp, meta} = data
                        const {vsn, plugin} = meta
                        const date = new Date(timestamp)
                        const end = (opts.time == 'daily' ? addDays(date, 1) : addHours(date, 1)).toISOString()
                        window.open(window.location.origin +
                          `/query-browser?nodes=${vsn}&apps=${plugin}.*&start=${timestamp}&end=${end}`
                        , '_blank')
                      }}
                      labelWidth={TIMELINE_LABEL_WIDTH}
                    />
                  </TimelineContainer>
                )
              })
          }

          <div ref={loader} />
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

const TimelineContainer = styled.div`
  margin-bottom: 100px;

  .title-row {
    margin: 0 20px;
    h2 {
      margin: 0;
    }
  }
`

const Items = styled.div`
  margin-top: 40px;
`

const LoadingMore = styled.div`
  font-size: 2em;
`
