import { useEffect, useState, useRef, useCallback, useReducer } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import Button from '@mui/material/Button'
import FileDownloadRounded from '@mui/icons-material/FileDownloadRounded'

import DataOptions from '/components/input/DataOptions'
import {
  Sidebar, Top, Controls, Divider, FilterTitle
} from '/components/layout/Layout'
import Filter from '../common/FacetFilter'
import ErrorMsg from '../ErrorMsg'

import { useProgress } from '/components/progress/ProgressProvider'
import TimelineChart, { TimelineContainer, colors } from '/components/viz/Timeline'
import TimelineSkeleton from '/components/viz/TimelineSkeleton'
import AppLabel from '/components/viz/TimelineAppLabel'
import { vsnLink } from '/components/views/nodes/nodeFormatters'

import * as BK from '/components/apis/beekeeper'
import * as ECR from '/components/apis/ecr'

import { chain, startCase } from 'lodash'
import { addDays, addHours, endOfHour, subDays, subYears } from 'date-fns'
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


const getStartTime = (str) =>
  str.includes('y') ?
    subYears(new Date(), str.replace(/-|y/g, '')) :
    subDays(new Date(), str.replace(/-|d/g, ''))


const getFacets = (data, name) =>
  chain(data)
    .countBy(name) // returns string 'undefined' if undefined
    .map((count, name) =>
      ({name: name == 'undefined' || !name || !name.length ? NO_ASSIGNMENT : name, count})
    )
    .value()


export const stdColor = (val) =>
  val == null ? colors.noValue : colors.blues[4]


export const colorDensity = (val) => {
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



type FacetItem = {name: string, count: number}

type Facets = {
  [name: string]: {title: string, items: FacetItem[], hide?: boolean}
}

export type Options = {
  display: 'nodes' | 'apps'
  time: 'hourly' | 'daily'
  density: boolean
  versions: boolean
  window: `-${number}d`
  start: Date
  end?: Date
}


type Props = {
  project?: BK.Node['project']
  focus?: string
  vsns?: BK.VSN[]
}

export default function Data(props: Props) {
  // alter init data state if project/focus is provided
  const {project, focus, vsns} = props

  if (project) initDataState.filters.project = [project]
  if (focus) initDataState.filters.focus = [focus]

  const [nodeDict, setNodeDict] = useState<BK.NodeDict>()
  const [nodes, setNodes] = useState<BK.Node[]>()
  const [ecr, setECR] = useState<ECR.AppDetails[]>()

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
    time: 'hourly',
    density: true,
    versions: false,
    window: `-${DAYS}d`,
    start: DATA_START || subDays(new Date(), DAYS),
    end: DATA_END || endOfHour(new Date())
  })


  useEffect(() => {
    setLoading(true)
    const mProm = BK.getNodeDict({project, vsns})
      .then(data => {
        setNodeDict(data)
        const nodes = Object.values(data)
        setNodes(nodes)

        const projects = getFacets(data, 'project')
        const focuses = getFacets(data, 'focus')
        const cities = getFacets(data, 'city')
        const states = getFacets(data, 'state')
        const vsns = getFacets(data, 'vsn')

        setFacets({
          project: {title: 'Project', items: projects, hide: !!project},
          focus: {title: 'Focus', items: focuses, hide: !!focus},
          city: {title: 'City', items: cities},
          state: {title: 'State', items: states},
          vsn: {title: 'Node', items: vsns}
        })

        return nodes
      }).catch(error => dispatch({type: 'ERROR', error}))

    const dProm = fetchRollup(opts)

    Promise.all([mProm, dProm])
      .then(([nodes, data]) => dispatch({type: 'INIT_DATA', data, nodes}))
      .catch(error => dispatch({type: 'ERROR', error}))
      .finally(() => setLoading(false))

  }, [opts.start, opts.end])


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
    if (checked) dispatch({type: 'ADD_FILTER', nodes, facet, val})
    else dispatch({type: 'RM_FILTER', nodes, facet, val})
  }


  const handleSelectAll = (evt, facet: string, vals: string[]) => {
    const checked = evt.target.checked
    if (checked) dispatch({type: 'SELECT_ALL', nodes, facet, vals})
    else dispatch({type: 'CLEAR_CATEGORY', nodes, facet})
  }

  // todo(nc): refactor into provider
  const handleOptionChange = (name, val) => {
    if (['nodes', 'apps'].includes(name)) {
      setPage(1) // reset page
      setOpts(prev => ({...prev, display: name}))
      return
    } else if (name == 'time') {
      const time = val
      const data = parseData({data: rawData, time})
      dispatch({type: 'SET_DATA', data})
      setOpts(prev => ({...prev, [name]: time}))
      return
    } else if (name == 'versions') {
      const versions = val
      const data = parseData({data: rawData, time: opts.time, versions})
      dispatch({type: 'SET_DATA', data})
      setOpts(prev => ({...prev, [name]: versions}))
      return
    } else if (name == 'density') {
      setOpts(prev => ({...prev, [name]: val}))
    } else if (name == 'window') {
      setOpts(prev => ({
        ...prev,
        ...(val && {window: val, start: getStartTime(val)})
      }))
    } else {
      throw `unhandled option state change name=${name}`
    }
  }

  const handleDateChange = ([start, end]: [Date, Date]) => {
    setOpts(prev => ({...prev, start, end}))
  }


  return (
    <Root className="flex">
      <Sidebar width="250px" style={{padding: '10px 0 100px 0'}}>
        <FilterTitle>Filters</FilterTitle>
        {facets && facetList.map(facet => {
          const {title, items, hide} = facets[facet] || {}

          if (hide) return <div key={title}></div>

          return (
            <Filter
              key={title}
              title={startCase(title.replace('res_', ''))}
              checked={filters[facet]}
              onCheck={(evt, val) => handleFilter(evt, facet, val)}
              onSelectAll={(evt, vals) => handleSelectAll(evt, facet, vals)}
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

            <div className="flex-grow">
              <DataOptions
                onChange={handleOptionChange}
                onDateChange={handleDateChange}
                opts={opts}
                quickRanges={['-30d', '-7d', '-2d', '-1d']}
                groupByToggle
                aggregation
                density
              />
            </div>
          </Controls>
        </Top>

        <Items>
          {opts.display == 'nodes' && filtered && ecr &&
            filtered
              .slice(0, getInfiniteEnd(page))
              .map(vsn => {
                const timelineData = data[vsn]
                const {location} = nodeDict[vsn]

                return (
                  <TimelineContainer key={vsn}>
                    <div className="flex title-row gap">
                      <div className="flex column">
                        <div>
                          <h2>{vsnLink(vsn, nodeDict[vsn])}</h2>
                        </div>
                        <div>{location}</div>
                      </div>

                      {DATA_PRODUCT_PATH &&
                        <div>
                          {getDownloadLink(DATA_PRODUCT_PATH)}
                        </div>
                      }
                    </div>
                    <TimelineChart
                      data={timelineData}
                      cellUnit={opts.time == 'daily' ? 'day' : 'hour'}
                      colorCell={opts.density ? colorDensity : stdColor}
                      startTime={opts.start}
                      endTime={opts.end}
                      tooltip={(item) => `
                        <div style="margin-bottom: 5px;">
                          ${new Date(item.timestamp).toDateString()}${' '}
                          ${new Date(item.timestamp).toLocaleTimeString([], {timeStyle: 'short'})}${' '}
                          (${TIME_WINDOW})
                        </div>
                        ${item.meta.plugin}<br>
                        ${item.value.toLocaleString()} records`
                      }
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
                    <h2><AppLabel label={name} ecr={ecr} /></h2>
                    <TimelineChart
                      data={timelineData}
                      limitRowCount={10}
                      cellUnit={opts.time == 'daily' ? 'day' : 'hour'}
                      colorCell={opts.density ? colorDensity : stdColor}
                      startTime={opts.start}
                      endTime={opts.end}
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
              <TimelineContainer key={i}>
                <TimelineSkeleton />
              </TimelineContainer>
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


const Items = styled.div`

`

const LoadingMore = styled.div`
  font-size: 2em;
`
