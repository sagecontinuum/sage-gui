import { useEffect, useState, useRef, useCallback, useReducer } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import FileDownloadRounded from '@mui/icons-material/FileDownloadRounded'

import DataOptions from './DataOptions'

import {Top} from '../common/Layout'
import Sidebar, {FilterTitle} from '../data-commons/DataSidebar'
import Filter from '../common/FacetFilter'
import ErrorMsg from '../ErrorMsg'

import TimelineSkeleton from '/components/viz/TimelineSkeleton'
import { useProgress } from '/components/progress/ProgressProvider'
import TimelineChart, {colors} from '/components/viz/TimelineChart'
import * as BK from '/components/apis/beekeeper'
import * as ECR from '/components/apis/ecr'

import { chain, startCase } from 'lodash'
import { addDays, endOfHour, subDays } from 'date-fns'
import { fetchRollup, parseData } from './rollupUtils'
import { initFilterState, initDataState, dataReducer } from './dataReducer'

import settings from '/apps/common/settings'
const MDP_NODES = settings.mdpNodes


// No assignment represents null, and is same as empty string in this view
const NO_ASSIGNMENT = 'None'
const TIME_WINDOW = 'hour'

const TIMELINE_MARGIN = {left: 175, right: 20, bottom: 0}
const ITEMS_INITIALLY = 10
const ITEMS_PER_PAGE = 5


const MDP_START = new Date('2022-04-05T12:00:00Z')
const MDP_END = new Date('2022-05-05T12:00:00Z')


const isMDP = (name) =>
  name?.toLowerCase() == 'neon-mdp'



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

const getDownloadLink = (vsn: string) =>
  MDP_NODES.includes(vsn) ?
    <Button
      startIcon={<FileDownloadRounded />}
      to="/data/product/neon-mdp-sage-wifire-bp3d-konza-prairie-burn-experiment"
      variant="outlined"
      component={Link}
    >
      Download
    </Button>
    : <></>


// todo(nc): temp solution until we have references!
// use the most recent app with same substring, ignoring "plugin-" and version
const findApp = (apps, name) =>
  apps.find(o => o.id.includes(name.replace('plugin-', '')))


type FacetItem = {name: string, count: number}

type Facets = {
  [name: string]: {title: string, items: FacetItem[] }
}


const filterOn = (data: BK.Manifest[], key: string, match?: string) =>
  data.filter(o => o[key].toLowerCase() == match?.toLowerCase())


export type Options = {
  display: 'nodes' | 'apps'
  time: 'hourly' | 'daily'
  density: boolean
  versions: boolean
  start: Date
}


type Props = {
  project?: string
  focus?: string
}

export default function Data(props: Props) {
  // alter init data state if project/focus is provided
  const {project, focus} = props

  if (project) initDataState.filters.project = [project]
  if (focus) initDataState.filters.focus = [focus]

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
    start: isMDP(focus) ? MDP_START : subDays(new Date(), 30)
  })

  // note: endtime is not currently an option
  const [end, setEnd] = useState<Date>(isMDP(focus) ? MDP_END : endOfHour(new Date()))

  useEffect(() => {
    setLoading(true)
    const mProm = BK.getManifest({by: 'vsn'})
      .then(data => {
        setManifestByVSN(data) // todo(nc): remove

        let manifests = Object.values(data)

        if (project) manifests = filterOn(manifests, 'project', project)
        if (focus) manifests = filterOn(manifests, 'focus', focus)

        setManifests(manifests)

        const projects = getFacets(manifests, 'project')
        const focuses = getFacets(manifests, 'focus')
        const locations = getFacets(manifests, 'location')
        const vsns = getFacets(manifests, 'vsn')

        setFacets({
          project: {title: 'Project', items: projects, hide: !!project},
          focus: {title: 'Focus', items: focuses, hide: !!focus},
          location: {title: 'Location', items: locations},
          vsn: {title: 'Node', items: vsns}
        })

        return manifests
      }).catch(error => dispatch({type: 'ERROR', error}))

    const dProm = fetchRollup({...opts, end: addDays(opts.start, 30)})

    Promise.all([mProm, dProm])
      .then(([manifests, data]) => dispatch({type: 'INIT_DATA', data, manifests}))
      .catch(error => dispatch({type: 'ERROR', error}))
      .finally(() => setLoading(false))

  }, [opts.start])


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
    setEnd(addDays(start, 30))
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
          );
        })}
      </Sidebar>
      <Main>
        <Top>
          <Controls className="flex items-center">
            <div className="flex column">
              <h2 className="title no-margin">Explore Data</h2>
              <h5 className="subtitle no-margin muted">
                {opts.display == 'nodes' &&
                  `${filtered.length} nodes with data`
                }
                {opts.display == 'apps' && byApp &&
                  `${Object.keys(byApp).length} apps with data`
                }
              </h5>
            </div>

            <Divider orientation="vertical" flexItem style={{margin: '0px 20px'}} />

            <DataOptions onChange={handleOptionChange} onDateChange={handleDateChange} opts={opts} />
          </Controls>
        </Top>

        <Items>
          {opts.display == 'nodes' && filtered && manifestByVSN &&
            filtered
              .slice(0, getInfiniteEnd(page))
              .map(vsn => {
                const timelineData = data[vsn]
                const {node_id, location} = manifestByVSN[vsn]

                return (
                  <TimelineContainer key={vsn}>
                    <div className="flex justify-between title-row">
                      <div className="flex column">
                        <div>
                          <h2><Link to={`/node/${node_id}`}>{vsn}</Link></h2>
                        </div>
                        <div>{location}</div>
                      </div>

                      <div className="data-opts">
                        {getDownloadLink(vsn)}
                      </div>
                    </div>
                    <TimelineChart
                      data={timelineData}
                      cellUnit={opts.time == 'daily' ? 'day' : 'hour'}
                      colorCell={opts.density ? colorDensity : stdColor}
                      startTime={opts.start}
                      endTime={end}
                      tooltip={(item) => `
                        <div style="margin-bottom: 5px;">
                          ${new Date(item.timestamp).toDateString()} ${new Date(item.timestamp).toLocaleTimeString([], {timeStyle: 'short'})} (${TIME_WINDOW})
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
                        const {vsn, plugin} = meta
                        const win = opts.time == 'daily' ? 'd' : 'h'
                        window.open(`${window.location.origin}/data-browser?nodes=${vsn}&apps=${plugin.replace('/', '.*')}.*&start=${timestamp}&window=${win}`, '_blank')
                      }}
                      margin={TIMELINE_MARGIN}
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
                        window.open(`${window.location.origin}/data-browser?nodes=${vsn}&apps=${plugin.replace('/', '.*')}.*&start=${timestamp}&window=${win}`, '_blank')
                      }}
                      margin={TIMELINE_MARGIN}
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

const Controls = styled.div`
  background-color: #fff;
  padding: 10px 0;
  border-bottom: 1px solid #ddd;

  .checkboxes {
    margin-top: 17px;
  }
`

const TimelineContainer = styled.div`
  margin-bottom: 100px;

  .title-row {
    margin 0 20px;
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
