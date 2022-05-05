import { useEffect, useState } from 'react'
import styled from 'styled-components'

import Sidebar, {FilterTitle} from '../data/DataSidebar'
import Filter from '../data/Filter'

import TimelineChart, {colors} from '/components/viz/TimelineChart'
import {chain, groupBy, startCase} from 'lodash'

import * as BK from '/components/apis/beekeeper'
import {handleErrors} from '/components/fetch-utils'
import ErrorMsg from '/apps/sage/ErrorMsg'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'



// No assignment represents null, and is same as empty string in this view
const NO_ASSIGNMENT = 'None'
const TIME_GRAIN = 'hour'


function fetchMockRollup({byVersion = false, groupName = 'meta.vsn'}) {
  return fetch('http://127.0.0.1:8080/last-30d-april-26-2022.json')
    .then(handleErrors)
    .then(res => res.json())
    .then(data => data.map(o => {
      const { plugin } = o.meta
      return {
        ...o,
        timestamp: o.timestamp.split('+')[0]+'Z',
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
  nodes ? `${nodes?.length} Nodes` : `${apps?.length} Apps`


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


export default function DataExplorer() {
  const [manifests, setManifests] = useState<BK.Manifests[]>()

  // main data views
  const [data, setData] = useState()
  const [error, setError] = useState()

  const [byApp, setByApp] = useState()

  const [vsns, setVsns] = useState<string[]>([])
  const [apps, setApps] = useState<string[]>()

  const [facets, setFacets] = useState<Facets>(null)
  const [filterState, setFilterState] = useState<FilterState>(initFilterState)

  // option state
  const [display, setDisplay] = useState<'nodes' | 'apps'>('nodes')


  useEffect(() => {
    BK.getManifest({by: 'vsn'})
      .then(data => {
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

    fetchMockRollup({})
      .then(data => {
        setData(data)
      })
      .catch(err => setError(err))
  }, [])


  useEffect(() => {
    if (!data) return
    const mockByApp = getMockByApp(data)
    setByApp(mockByApp)
    setApps(Object.keys(mockByApp))
  }, [display])


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


  const nodes = data && Object.keys(data)
    .filter(vsn => vsns.length ? vsns.includes(vsn) : true)

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
        <div className="flex">
          <h1 className="no-margin">
            {getTitle(nodes, apps)}
          </h1>
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
        </div>


        {display == 'nodes' && data &&
          Object.keys(data)
            .filter(vsn => vsns.length ? vsns.includes(vsn) : true)
            .slice(0, 10)
            .map(vsn => {
              const timelineData = groupBy(data[vsn], 'meta.plugin')

              return (
                <TimelineContainer key={vsn}>
                  <h2 className="pull-left">{vsn}</h2>
                  <TimelineChart
                    data={timelineData}
                    colorCell={colorDensity}
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
            .map(name => {
              const timelineData = byApp[name]
              return (
                <TimelineContainer key={name}>
                  <h2 className="pull-left">{name}</h2>
                  <TimelineChart
                    data={timelineData}
                    colorCell={colorDensity}
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

        <br/>
        {error &&
          <ErrorMsg>{error.message}</ErrorMsg>
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
  height: 100%;
  margin: 30px 20px 30px 0;
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

const TimelineContainer = styled.div`
  margin-bottom: 100px;
`
