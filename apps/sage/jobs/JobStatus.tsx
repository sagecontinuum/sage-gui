import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useLocation, NavLink, useMatch } from 'react-router-dom'
import styled from 'styled-components'

import { Button } from '@mui/material'

import ListIcon from '@mui/icons-material/ListRounded'
import TimelineIcon from '@mui/icons-material/ViewTimelineOutlined'
import PublicIcon from '@mui/icons-material/PieChart'
import AddIcon from '@mui/icons-material/AddRounded'
import MyJobsIcon from '@mui/icons-material/Engineering'

import Map from '/components/Map'
import ErrorMsg from '/apps/sage/ErrorMsg'

import Table, { TableSkeleton } from '/components/table/Table'
import { queryData } from '/components/data/queryData'
import { relativeTime } from '/components/utils/units'

import JobTimeLine from './JobTimeline'
import JobDetails from './JobDetails'

import { Tabs, Tab } from '/components/tabs/Tabs'
import { useProgress } from '/components/progress/ProgressProvider'
import { Card } from '/components/layout/Layout'

import * as BK from '/components/apis/beekeeper'
import * as ES from '/components/apis/ses'
import { username } from '/components/auth/auth'


// todo(nc): options
// import JobOptions from './JobOptions'


export type Options = {
  showErrors: boolean
}


export const formatters = {
  apps: (objs) => <>
    {objs.map((obj, i) => {
      const {name, plugin_spec} = obj
      const {image} = plugin_spec

      // todo(nc): ignore dockerhub component for now?
      const app = image.replace('registry.sagecontinuum.org/', '').split(':')[0]

      const l = objs.length - 1
      return <span key={name}>
        <Link to={`/apps/app/${app}`}>
          {name}
        </Link>{i < l ? ', '  : ''}
      </span>
    })}
  </>,
  nodes: (vsns, obj) => <>
    {vsns.map((vsn, i) => {
      const l = vsns.length - 1
      return <span key={vsn}>
        <Link to={`/node/${obj.node_ids[i]}`}>
          {vsn}
        </Link>{i < l ? ', '  : ''}
      </span>
    })}
  </>
}

const jobCols = [{
  id: 'name',
  label: 'Name',
  format: (val, row) => {
    const nodes = row.nodes
    return <Link to={`/jobs?job=${row.id}`}>{val}</Link>
  }
}, {
  id: 'id',
  label: 'ID'
}, {
  id: 'status',
  label: 'Status',
  format: (_, obj) => {
    let status = obj.state.last_state || '-'
    status = status.toLowerCase()
    return <b className={status}>{status}</b>
  },
  width: '100px'
}, {
  id: 'user',
  label: 'User'
}, {
  id: 'nodes',
  label: 'Nodes',
  format: formatters.nodes
}, {
  id: 'nodeCount',
  label: 'Node count',
  hide: true,
  format: (_, obj) =>
    <b className="muted">{obj.nodes.length}</b>
}, {
  id: 'apps',
  label: 'Apps',
  format: formatters.apps
}, {
  id: 'appCount',
  label: 'App count',
  hide: true,
  format: (_, obj) =>
    <b className="muted">{obj.apps.length}</b>
}, {
  id: 'submitted',
  label: 'Submitted',
  width: '100px',
  format: (_, {state}) => {
    return relativeTime(state.last_submitted) || '-'
  }
}, {
  id: 'updated',
  label: 'Updated',
  width: '100px',
  format: (_, {state}) => {
    return relativeTime(state.last_updated) || '-'
  }
}, {
  id: 'last_completed',
  label: 'Completed',
  width: '100px',
  format: (_, {state}) => {
    return relativeTime(state.last_completed) || '-'
  }
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
}]


function jobsToGeos(
  jobs: ES.Job[],
  manifestByVSN: ManifestByVSN
) : GeoData {
  return (jobs || [])
    .flatMap(o => o.nodes)
    .map(vsn => ({
      id: vsn,
      vsn,
      lng: manifestByVSN[vsn].gps_lon,
      lat: manifestByVSN[vsn].gps_lat,
      status: 'reporting'
    }))
  }


export type ByNode = {[vsn: string]: ES.PluginEvent[]}

type State = {
  jobs: ES.Job[]
  byNode: ByNode
  isFiltered: boolean
  qJobs: ES.Job[]
  qNodes: string[]
  selected: GeoData
}

const initState = {
  jobs: [],
  byNode: {},
  isFiltered: false,
  qJobs: null,
  selected: [],
}


type ManifestByVSN = {[vsn: string]: BK.Manifest}

type GeoData = {id: string, vsn: string, lng: number, lat: number, status: string}[]

export default function JobStatus() {
  const navigate = useNavigate()

  const {view = 'jobs-status', jobName} = useParams()

  const params = new URLSearchParams(useLocation().search)
  const query = params.get('query') || ''
  const nodes = params.get('nodes') || ''
  const job = params.get('job') || ''
  const tab = params.get('tab') || 'jobs'

  const {loading, setLoading} = useProgress()

  const [{
    jobs, byNode, isFiltered, qJobs, qNodes, selected
  }, setData] = useState<State>(initState)

  // additional meta
  const [manifestByVSN, setManifestByVSN] = useState<ManifestByVSN>()
  const [geo, setGeo] = useState<GeoData>()

  const [updateID, setUpdateID] = useState(0)

  const [lastUpdate, setLastUpdate] = useState(null)

  const [error, setError] = useState()

  /* todo(nc): options
  const [opts, setOpts] = useState<Options>({
    showErrors: true
  })

  const [filters, setFilters] = useState({
    goals: []
  })
  */

  useEffect(() => {
    if (!jobs || !manifestByVSN) return

    const qJobs = queryData<ES.Job>(jobs, query)
    const qNodes = qJobs.flatMap(o => o.nodes)

    setData(prev => ({
      ...prev,
      isFiltered: query.length > 0 || selected?.length > 0,
      qJobs,
      qNodes
    }))

  }, [query, jobs, manifestByVSN, selected])


  useEffect(() => {
    setLoading(true)

    const filterUser = view == 'my-jobs' && username
    const params = filterUser ? {user: username} : null

    const p1 = ES.getAllData(params)
      .then(({jobs, byNode}) => {
        return {jobs, byNode}
      })

    // also fetch gps for map
    const p2 = BK.getManifest({by: 'vsn'})

    Promise.all([p1, p2])
      .then(([{jobs, byNode}, data]) => {
        setManifestByVSN(data)

        // todo(nc): remove when VSNs are used for urls
        jobs = jobs.map(o => ({...o, node_ids: o.nodes.map(vsn => data[vsn].node_id)}))

        setData({jobs, byNode})

        const vsns = Object.keys(byNode)

        const geo = vsns.map(vsn => {
          const d = data[vsn]
          const lng = d.gps_lon
          const lat = d.gps_lat

          return {...data[vsn], id: vsn, vsn, lng, lat, status: 'reporting'}
        })

        setGeo(geo)
      }).catch(err => {
        console.error(err)
        setError(err.message)
      })
      .finally(() => setLoading(false))

  }, [setLoading, view])


  const handleJobSelect = (sel) => {
    const objs = sel.objs.length ? sel.objs : null
    const nodes = jobsToGeos(objs, manifestByVSN)

    setData(prev => ({...prev, selected: nodes.length ? nodes : []}))
    setUpdateID(prev => prev + 1)
  }

  const handleGoalSelect = (objs) => {
    // todo
  }

  const handleOptionChange = () => {
    // todo
  }

  const handleQuery = ({query}) => {
    if (query) params.set('query', query)
    else params.delete('query')
    navigate({search: params.toString()}, {replace: true})
  }

  const handleCloseDialog = () => {
    params.delete('job')
    navigate(`/jobs/${view}?tab=${tab}`, {search: params.toString(), replace: true})
  }

  const getSubset = (selected, nodes) => {
    const ids = selected.map(o => o.id)
    const subset = nodes.filter(obj => ids.includes(obj.id))
    return subset
  }



  return (
    <Root>
      <div className="flex">
        <Main className="flex column">
          {/* todo?: some controls
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
          <Tabs
            value={view}
            aria-label="tabs of data links"
            sx={{marginBottom: '10px'}}
          >
            <Tab
              label={<div className="flex items-center">
                <PublicIcon />&nbsp;System Status
              </div>}
              component={NavLink}
              value="system-status"
              to="/jobs/system-status"
              replace
            />
            {username &&
              <Tab
                label={
                  <div className="flex items-center">
                    <MyJobsIcon/>&nbsp;My Jobs
                  </div>
                }
                value="my-jobs"
                component={NavLink}
                to="/jobs/my-jobs?tab=jobs"
                replace
              />
            }

            {view == 'my-jobs' &&
              <Button
                component={Link}
                to="/create-job"
                variant="contained"
                color="primary"
                startIcon={<AddIcon/>}
                size="small"
                className="create-job-btn"
              >
                Create job
              </Button>
            }
          </Tabs>

          <MapContainer>
            {geo &&
              <Map
                data={selected?.length ? getSubset(selected, geo) : geo}
                updateID={updateID} />
            }
          </MapContainer>

          <Tabs
            value={tab}
            aria-label="job status tabs"
          >
            {!jobName &&
              <Tab
                label={
                  <div className="flex items-center">
                    <ListIcon/>&nbsp;Jobs ({jobs ? jobs.length : '...'})
                  </div>
                }
                value="jobs"
                component={Link}
                to={`/jobs/${view}?tab=jobs`}
                replace
              />
            }

            <Tab
              label={<div className="flex items-center">
                <TimelineIcon />&nbsp;Timelines
              </div>}
              value="timeline"
              component={Link}
              to={`/jobs/${view}?tab=timeline`}
              replace
            />
          </Tabs>

          {loading &&
            <TableSkeleton />
          }

          {tab == 'jobs' && qJobs && !loading &&
            <TableContainer>
              <Table
                primaryKey="id"
                rows={qJobs}
                columns={jobCols}
                enableSorting
                sort="-submitted"
                onSearch={handleQuery}
                onSelect={handleJobSelect}
                onColumnMenuChange={() => { /* do nothing special */ }}
                middleComponent={
                  <TableOptions>
                    {isFiltered &&
                      <Button
                        variant="contained"
                        component={Link}
                        to={`?tab=timeline&nodes=${selected?.map(o => o.vsn).join(',')}`}
                      >
                        View timeline{selected?.length > 1 ? 's' : ''}
                      </Button>
                    }
                  </TableOptions>
                }
              />
            </TableContainer>
          }

          {tab == 'timeline' && byNode && manifestByVSN &&
            <TimelineContainer>
              {Object.keys(byNode)
                .filter(vsn => nodes ? nodes.includes(vsn) : true)
                .map((vsn, i) => {
                  const {location, node_id} = manifestByVSN[vsn]
                  return (
                    <Card key={i} className="title-row">
                      <div className="flex column">
                        <div>
                          <h2><Link to={`/node/${node_id}`}>{vsn}</Link></h2>
                        </div>
                        <div>{location}</div>
                      </div>
                      <JobTimeLine data={byNode[vsn]} />
                    </Card>
                  )
                })
              }
            </TimelineContainer>
          }

          {error &&
            <ErrorMsg>{error}</ErrorMsg>
          }
        </Main>
      </div>

      {(job ? (jobs || []).find(o => o.job_id == job) : null) && jobs && byNode &&
        <JobDetails
          job={job ? (jobs || []).find(o => o.job_id == job) : null}
          jobs={jobs}
          byNode={byNode}
          manifestByVSN={manifestByVSN}
          handleCloseDialog={handleCloseDialog}
        />
      }
    </Root>
  )
}



const Root = styled.div`
  margin: 10px 20px;

  .create-job-btn {
    margin-left: auto;
    height: 34px;
    margin-top: 4px;
  }
`

const Main = styled.div`
  width: 100%;
  margin-bottom: 100px;
`

const MapContainer = styled.div`
  width: 100%;
  height: 350px;
`

export const TimelineContainer = styled.div`
  margin-bottom: 50px;
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

const TableOptions = styled.div`
  margin-left: 20px;
`

