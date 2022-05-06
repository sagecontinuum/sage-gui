import { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

// import {fetchMockRollup} from './fetchMockRollup'
import TimelineSkeleton from './TimelineSkeleton'
import {Top} from '../common/Layout'
import Sidebar, {FilterTitle} from '../data-commons/DataSidebar'
import Filter from '../data-commons/Filter'
import ErrorMsg from '../ErrorMsg'

import { useProgress } from '/components/progress/ProgressProvider'
import TimelineChart, {colors} from '/components/viz/TimelineChart'
import * as BK from '/components/apis/beekeeper'
import * as BH from '/components/apis/beehive'

import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'


import {chain, groupBy, startCase} from 'lodash'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '/components/input/Checkbox'


// No assignment represents null, and is same as empty string in this view
const NO_ASSIGNMENT = 'None'
const TIME_GRAIN = 'hour'

const ITEMS_INITIALLY = 10
const ITEMS_PER_PAGE = 5


function fetchRollup({byVersion = false, groupName = 'meta.vsn'}) {
  return BH.getPluginCounts()
    .then(data => data.map(o => {
      const { plugin } = o.meta
      return {
        ...o,
        meta: {
          ...o.meta,
          plugin: byVersion ? plugin : plugin.split(':')[0]
        }
      }
    }))
    .then(d => groupBy(d, groupName))
}


function getMockByApp(data) {
  const d = Object.values(data).flat()

  let byApp = groupBy(d, 'meta.plugin')
  const byAppByPlugin = Object.keys(byApp)
    .reduce((acc, app) => ({...acc, [app]: groupBy(byApp[app], 'meta.vsn')}), {})

  return byAppByPlugin
}


const getFilters = (data, name) =>
  chain(data)
    .countBy(name)
    .map((count, name) => ({name: name.length ? name : NO_ASSIGNMENT, count}))
    .value()


const getVSNs = (data, name, value) =>
  data.filter(o => o[name] == value).map(o => o.vsn)


const getTitle = (nodes, apps) =>
  nodes ?
    `${nodes?.length} Nodes` :
  apps ?
    `${apps?.length} Apps` : ''


  const stdColor = (val, obj) => {
    if (val == null)
      return colors.noValue

    return colors.blues[4]
  }

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



type FilterState = {
  [name: string]: string[]
}

type FacetItem = {name: string, count: number}

type Facets = {
  [name: string]: {title: string, items: FacetItem[] }
}


const initFilterState = {
  'projects': [],
  'focus': [],
  'location': []
}

const facetList = Object.keys(initFilterState)


export default function Data() {
  const navigate = useNavigate()

  const [manifestByVSN, setManifestByVSN] = useState<{[vsn: string]: BK.Manifest}>()
  const [manifests, setManifests] = useState<BK.Manifest[]>()

  // infinite scroll
  const [page, setPage] = useState(1)
  const loader = useRef(null)
  const [loadingMore, setLoadingMore] = useState(false)

  // main data views
  const {loading, setLoading} = useProgress()
  const [data, setData] = useState()
  const [error, setError] = useState()

  const [byApp, setByApp] = useState()

  const [vsns, setVsns] = useState<string[]>([])
  const [apps, setApps] = useState<string[]>()

  const [facets, setFacets] = useState<Facets>(null)
  const [filterState, setFilterState] = useState<FilterState>(initFilterState)

  // options
  const [display, setDisplay] = useState<'nodes' | 'apps'>('nodes')
  const [opts, setOpts] = useState<{colorCounts: boolean}>({
    colorCounts: false
  })


  useEffect(() => {
    setLoading(true)
    const mProm = BK.getManifest({by: 'vsn'})
      .then(data => {
        setManifestByVSN(data) // todo(nc): remove
        setManifests(Object.values(data))

        const projects = getFilters(data, 'project')
        const focuses = getFilters(data, 'focus')
        const locations = getFilters(data, 'location')

        setFacets({
          projects: {title: 'Project', items: projects},
          focus: {title: 'Focus', items: focuses},
          location: {title: 'Location', items: locations}
        })
      }).catch(err => setError(err))

    //fetchMockRollup({})
    const dProm = fetchRollup({})
      .then(data => {
        setData(data)
      })
      .catch(err => setError(err))

    Promise.all([mProm, dProm])
      .finally(() => setLoading(false))
  }, [])


  useEffect(() => {
    if (!data) return
    const mockByApp = getMockByApp(data)
    setByApp(mockByApp)
    setApps(Object.keys(mockByApp))
  }, [display])


  const handleObserver = useCallback((entries) => {
    const target = entries[0]
    if (!target.isIntersecting) return

    setLoadingMore(true)
    setTimeout(() => {
      setPage(prev => prev + 1)
    }, 100)
  }, [])


  useEffect(() => {
    const option = {
      root: null,
      rootMargin: '100px',
      threshold: 0
    };
    const observer = new IntersectionObserver(handleObserver, option)
    if (loader.current) observer.observe(loader.current)
  }, [handleObserver])


  useEffect(() => {
    // todo(nc): page > 1 may not be enough depending on position in page?
    if (page > 1)
      setLoadingMore(false)
  }, [page])


  const handleFilter = (facet: string, val: string) => {
    setFilterState(prev => {
      return {
        ...prev,
        [facet]: prev[facet].includes(val) ?
          prev[facet].filter(v => v != val) : [...prev[facet], val]
      }
    })

    const vsns = getVSNs(manifests, facet, val)
    setVsns(vsns)
  }


  const handleCheck = (evt, name) => {
    setOpts(prev => ({...prev, [name]: evt.target.checked}))
  }


  let nodes
  if (display == 'nodes') {
    nodes = data && Object.keys(data)
      .filter(vsn => vsns.length ? vsns.includes(vsn) : true)
  }

  return (
    <Root className="flex">
      <Sidebar width="260px" style={{padding: '0 10px'}}>
        <FilterTitle>Filters</FilterTitle>
        {facets && facetList.map(facet => {
          const {title, items} = facets[facet]

          return (
            <Filter
              key={title}
              title={startCase(title.replace('res_', ''))}
              checked={filterState[facet]}
              onCheck={(val) => handleFilter(facet, val)}
              type="text"
              data={items}
            />
          );
        })}
      </Sidebar>
      <Main>
        <Top>
          <Controls className="flex">
            <h2 className="no-margin">
              {getTitle(nodes, apps)}
            </h2>

            <div>
              <ToggleButtonGroup
                value={display}
                onChange={(evt, val) => setDisplay(val)}
                aria-label="high-levrel group by"
                exclusive
              >
                <ToggleButton value="nodes" aria-label="nodes">
                  Nodes
                </ToggleButton>
                <ToggleButton value="apps" aria-label="apps">
                  Apps
                </ToggleButton>
              </ToggleButtonGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={opts.colorCounts}
                    onChange={(evt) => handleCheck(evt, 'colorCounts')}
                  />
                }
                label="color counts"
              />
            </div>
          </Controls>
        </Top>


        {display == 'nodes' && nodes && manifestByVSN &&
          nodes
            .slice(0, getInfiniteEnd(page))
            .map(vsn => {
              const timelineData = groupBy(data[vsn], 'meta.plugin')

              return (
                <TimelineContainer key={vsn}>
                  <h2 className="pull-left">
                    <Link to={`/node/${manifestByVSN[vsn].node_id}`}>{vsn}</Link>
                  </h2>
                  <TimelineChart
                    data={timelineData}
                    colorCell={opts.colorCounts ? colorDensity : stdColor}
                    tooltip={(item) =>
                      `
                      <div style="margin-bottom: 5px;">
                        ${new Date(item.timestamp).toDateString()} ${new Date(item.timestamp).toLocaleTimeString([], {timeStyle: 'short'})} (${TIME_GRAIN})
                      </div>
                      ${item.meta.plugin}<br>
                      ${item.value.toLocaleString()} records`
                    }
                    onRowClick={(val, data) =>
                      console.log('row click', val, data)
                    }
                    onCellClick={(data) => {
                      const {timestamp, meta} = data
                      const {vsn, plugin} = meta
                      window.open(`https://portal.sagecontinuum.org/data-browser?nodes=${vsn}&apps=${plugin}.*&start=${timestamp}&window=h`)
                    }}
                    margin={{right: 0, bottom: 0}}
                  />
                </TimelineContainer>
              )
            })
        }

        {display == 'apps' && byApp &&
          apps
            .slice(0, getInfiniteEnd(page))
            .map(name => {
              const timelineData = byApp[name]
              return (
                <TimelineContainer key={name}>
                  <h2 className="pull-left">{name}</h2>
                  <TimelineChart
                    data={timelineData}
                    colorCell={opts.colorCounts ? colorDensity : stdColor}
                    tooltip={(item) =>
                      `
                      <div style="margin-bottom: 5px;">
                        ${new Date(item.timestamp).toDateString()} ${new Date(item.timestamp).toLocaleTimeString([], {timeStyle: 'short'})} (${TIME_GRAIN})
                      </div>
                      ${item.meta.plugin}<br>
                      ${item.value.toLocaleString()} records`
                    }
                    onRowClick={(val, data) => {
                      const {meta} = data[0]
                      const {node} = meta
                      navigate(`/node/${node.toUpperCase()}`)
                      window.open(`${window.location.origin}/data-browser?nodes=${vsn}&apps=${plugin}.*&start=${timestamp}&window=h`)
                    }}
                    onCellClick={(data) => {
                      const {timestamp, meta} = data
                      const {vsn, plugin} = meta
                      window.open(`${window.location.origin}/data-browser?nodes=${vsn}&apps=${plugin}.*&start=${timestamp}&window=h`)
                    }}
                    margin={{right: 0, bottom: 0}}
                  />
                </TimelineContainer>
              )
            })
        }

        <br/>
        {error &&
          <ErrorMsg>{error.message}</ErrorMsg>
        }

        {(loading || loadingMore) && (nodes && !(getInfiniteEnd(page) > nodes.length)) &&
          [...Array(ITEMS_INITIALLY)]
            .map((_, i) =>
              <TimelineSkeleton />
            )
        }

        {loadingMore && (nodes && !(getInfiniteEnd(page) > nodes.length)) &&
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

  h1 {
    margin-right: 1em;
  }

  h2 {
    float: left;
    margin: 5px 20px;
  }
`

const Controls = styled.div`
  background-color: #fff;
  padding: 10px 0;
  border-bottom: 1px solid #ddd;

  [role=group] {
    margin-right: 10px;
  }
`

const TimelineContainer = styled.div`
  margin-bottom: 100px;
`

const LoadingMore = styled.div`
  font-size: 2em;

`
