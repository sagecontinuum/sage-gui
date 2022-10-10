import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'

import Alert from '@mui/material/Alert'

import { Breadcrumbs, Typography, Chip } from '@mui/material'

import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import ListIcon from '@mui/icons-material/ListRounded'
import ScienceIcon from '@mui/icons-material/ScienceRounded'
import TimelineIcon from '@mui/icons-material/ViewTimelineOutlined'

import Map from '/components/Map'
import Table from '/components/table/Table'
import ErrorMsg from '/apps/sage/ErrorMsg'

import JobTimeLine from './JobTimeline'

import { Sidebar, Top, Controls, Divider } from '../common/Layout'
import { Tabs, Tab } from '/components/tabs/Tabs'
import { relativeTime } from '/components/utils/units'
import Filter from '../common/FacetFilter'

import * as BK from '/components/apis/beekeeper'
import * as ES from '/components/apis/ses'
import { useProgress } from '/components/progress/ProgressProvider'
import JobOptions from './JobOptions'


export type Options = {
  showErrors: boolean
}


const jobCols = [{
  id: 'name',
  label: 'Name',
  format: (val) => {
    return <Link to={`/job-status/goals/${val}`}>{val}</Link>
  }
}, {
  id: 'id',
  label: 'ID'
}, {
  id: 'status',
  label: 'Status',
  format: (status, val) => {
    status = status == 'Submitted' ? 'in-progress' : status.toLowerCase()
    return <b className={status}>{status}</b>
  },
  width: '100px'
}, {
  id: 'user',
  label: 'User'
}, {
  id: 'nodes',
  label: 'Nodes',
  format: (vsns) => <>
    {vsns.map((vsn, i) => {
      const l = vsns.length - 1
      return <span key={vsn}>
        <Link to={`/nodes/${vsn}`} target="_blank">
          {vsn}
        </Link>{i < l ? ', '  : ''}
      </span>
    })}
  </>
}, {
  id: 'nodeCount',
  label: 'Node count',
  hide: true,
  format: (_, obj) =>
    <b className="muted">{obj.nodes.length}</b>
}, {
  id: 'apps',
  label: 'Apps',
  format: (objs) => <>

    {objs.map((obj, i) => {
      const {name, plugin_spec} = obj
      const {image} = plugin_spec

      // todo(nc): ignore dockerhub component for now?
      const app = image.replace('registry.sagecontinuum.org/', '').split(':')[0]

      const l = objs.length - 1
      return <span key={name}>
        <Link to={`/apps/app/${app}`} target="_blank">
          {name}
        </Link>{i < l ? ', '  : ''}
      </span>
    })}
  </>
}, {
  id: 'appCount',
  label: 'App count',
  hide: true,
  format: (_, obj) =>
    <b className="muted">{obj.apps.length}</b>
}]


const goalCols = [{
  id: 'name',
  label: 'Name'
}, {
  id: 'id',
  label: 'ID',
  format: (v) => v.split('-')[0]
}, {
  id: 'appCount',
  label: 'Apps',
}, {
  id: 'last_updated',
  label: 'Updated'
}]



type GeoData = {id: string, lng: number, lat: number}[]

export default function JobStatus() {
  let {tab = 'jobs', jobName} = useParams()
  const {setLoading} = useProgress()

  const [{jobs, goals, byNode}, setData] = useState<{
    jobs: ES.Job[],
    goals: ES.Goal[],
    byNode: {[vsn: string]: ES.PluginEvent[]}
  }>({})

  // additional meta
  const [manifestByVSN, setManifestByVSN] = useState<{[vsn: string]: BK.Manifest}>()
  const [geo, setGeo] = useState<GeoData>()
  const [selected, setSelected] = useState()
  const [updateID, setUpdateID] = useState(0)

  const [lastUpdate, setLastUpdate] = useState(null)


  const [error, setError] = useState()

  // options
  const [opts, setOpts] = useState<Options>({
    showErrors: true
  })

  const [filters, setFilters] = useState({
    goals: []
  })


  useEffect(() => {
    setLoading(true)

    ES.getAllData()
      .then(({jobs, byNode}) => {
        setData({jobs, byNode})

        // also fetch gps for map
        BK.getManifest({by: 'vsn'})
          .then(data => {
            setManifestByVSN(data)

            const vsns = Object.keys(byNode)

            const geo = vsns.map(vsn => {
              const d = data[vsn]
              const lng = d.gps_lon
              const lat = d.gps_lat

              return {id: vsn, vsn, lng, lat, status: 'reporting'}
            })

            setGeo(geo)
          })
      })
      .catch(err => {
        console.error(err)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [setLoading])


  const handleJobSelect = (sel) => {
    let objs = sel.objs.length ? sel.objs : null
    const nodes = (objs || [])
      .map(o => o.nodes)
      .flat()
      .map(vsn => ({
        id: vsn,
        vsn,
        lng: manifestByVSN[vsn].gps_lon,
        lat: manifestByVSN[vsn].gps_lat,
        status: geo.find(o => o.vsn == vsn) ? 'reporting' : 'dot'
      }))


    setSelected(nodes.length ? nodes : null)
    setUpdateID(prev => prev + 1)
  }

  const handleGoalSelect = (objs) => {
    // todo
  }

  const handleOptionChange = () => {
    // todo
  }

  const handleQuery = () => {
    // todo
  }

  return (
    <Root>
      <div className="flex">
        {/* todo: project filtering
        <CustomSidebar width="275px">
          <h2>Science Goals</h2>
          {/*goals &&
            <Filter
              title="Jobs"
              key="name"
              checked={filters.goals}
              show={50}
              // onCheck={(evt, val) => handleFilter(evt, facet, val)}
              // onSelectAll={(evt, vals) => handleSelectAll(evt, facet, vals)}
              type="text"
              data={goals.map(({name, appCount}) => ({name, count: appCount}))}
            />
        </CustomSidebar>
        */}

        <Main className="flex column">
          {/*
          <Top>
            <Controls className="flex items-center">
              <div className="flex column">
                <h2 className="title no-margin">Job Status</h2>
                <h5 className="subtitle no-margin muted">
                  {byNode ? Object.keys(byNode).length : '...'} nodes with jobs
                </h5>
              </div>

              <Divider  />

              <JobOptions
                onChange={handleOptionChange}
                opts={opts}
              />
            </Controls>
          </Top>
          */}

          <MapContainer>
            {geo &&
              <Map data={geo} selected={selected} resize={false} updateID={updateID} />
            }
          </MapContainer>

          <div style={{marginBottom: 5}}>
            <br/>
            <Breadcrumbs
              separator={<NavigateNextIcon fontSize="small" />}
              aria-label="breadcrumb"
            >
              <Link key="1" to="/job-status/jobs" color={jobName ? 'text.primary' : 'inherit'}>
                <Chip label="All Jobs"/>
              </Link>
              {jobName &&
                <Typography key="3" color="text.primary">
                  {jobName}
                </Typography>
              }
            </Breadcrumbs>
          </div>

          <Tabs
            value={tab}
            aria-label="tabs of data links"
          >
            {!jobName &&
              <Tab
                label={
                  <div className="flex items-center">
                    <ListIcon/>&nbsp;Job List ({jobs ? jobs.length : '...'})
                  </div>
                }
                value="jobs"
                component={Link}
                to="/job-status/jobs"
                replace
              />
            }
            <Tab
              label={
                <div className="flex items-center">
                  <ScienceIcon/>&nbsp;Goals ({goals ? goals.length : '...'})
                </div>
              }
              value="goals"
              component={Link}
              to="/job-status/goals"
              replace
            />
            <Tab
              label={<div className="flex items-center">
                <TimelineIcon />&nbsp;Timelines
              </div>}
              value="timeline"
              component={Link}
              to="/job-status/timeline"
              replace
            />
          </Tabs>

          {tab == 'jobs' && jobs &&
            <TableContainer>
              <Table
                primaryKey="id"
                rows={jobs}
                columns={jobCols}
                enableSorting
                sort="-status"
                onSelect={handleJobSelect}
                onSearch={handleQuery}
                onColumnMenuChange={() => {}}
                onColumnMenuChange
              />
            </TableContainer>
          }

          {tab == 'goals' && goals &&
            <TableContainer>
              <Table
                primaryKey="rowID"
                rows={jobName ? goals.filter(o => o.name == jobName) : goals}
                columns={goalCols}
                enableSorting
                onSelect={handleGoalSelect}
              />
            </TableContainer>
          }

          {tab == 'timeline' && byNode && manifestByVSN &&
            <TimelineContainer>
              {Object.keys(byNode).map((node, i) => {
                const {location, node_id} = manifestByVSN[node]
                return (
                  <div key={i} className="title-row">
                    <div className="flex column">
                      <div>
                        <h2><Link to={`/node/${node_id}`}>{node}</Link></h2>
                      </div>
                      <div>{location}</div>
                    </div>
                    <JobTimeLine data={byNode[node]} />
                  </div>
                )
              })}
            </TimelineContainer>
          }

          {error &&
            <ErrorMsg>{error}</ErrorMsg>
          }
        </Main>
      </div>
    </Root>
  )
}



const Root = styled.div`
  margin: 20px;
`

const CustomSidebar = styled(Sidebar)`
  padding: 0 10px;
  //padding: 20px 10px;
`

const Main = styled.div`
  width: 100%;
  margin-bottom: 1400px;
`

const MapContainer = styled.div`
  width: 100%;
  height: 350px;
`

const TimelineContainer = styled.div`
  padding: 0 1.2em;

  .title-row {
    margin: 20px;
    h2 {
      margin: 0;
    }
  }
`

const TableContainer = styled.div`
  margin-top: 1em;

  & .MuiInputBase-root {
    max-width: 100%;
    background: #fff;
  }

  table {
    background: #fff;
  }
`