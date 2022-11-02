import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useLocation, NavLink, useMatch } from 'react-router-dom'
import styled from 'styled-components'

import { Button } from '@mui/material'

import ListIcon from '@mui/icons-material/ListRounded'
import TimelineIcon from '@mui/icons-material/ViewTimelineOutlined'
import PublicIcon from '@mui/icons-material/PieChart'
import AddIcon from '@mui/icons-material/AddRounded'

import Map from '/components/Map'
import Table from '/components/table/Table'
import ErrorMsg from '/apps/sage/ErrorMsg'

import { queryData } from '/components/data/queryData'
import ConfirmationDialog from '/components/dialogs/ConfirmationDialog'

import JobTimeLine from './JobTimeline'

import { Tabs, Tab } from '/components/tabs/Tabs'
import { relativeTime } from '/components/utils/units'
import { useProgress } from '/components/progress/ProgressProvider'
// import { Sidebar, Top, Controls, Divider } from '/components/layout/Layout'

import * as BK from '/components/apis/beekeeper'
import * as ES from '/components/apis/ses'
import MetaTable from '/components/table/MetaTable'

// todo(nc): options
// import JobOptions from './JobOptions'

// todo(nc): my jobs
// import { isSignedIn } from '/components/auth/auth'

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


type State = {
  jobs: ES.Job[]
  byNode: {[vsn: string]: ES.PluginEvent[]}
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
  const path = useMatch('*').pathname

  const {tab = 'jobs-status', jobName} = useParams()
  const params = new URLSearchParams(useLocation().search)
  const query = params.get('query') || ''
  const nodes = params.get('nodes') || ''
  const job = params.get('job') || ''

  const {setLoading} = useProgress()

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

    ES.getAllData()
      .then(({jobs, byNode}) => {

        // also fetch gps for map
        BK.getManifest({by: 'vsn'})
          .then(data => {
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
          })
      })
      .catch(err => {
        console.error(err)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [setLoading])


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
    navigate('/jobs/job-status', {search: params.toString()}, {replace: true})
  }

  const getSubset = (selected, nodes) => {
    const ids = selected.map(o => o.id)
    const subset = nodes.filter(obj => ids.includes(obj.id))
    return subset
  }


  const jobMeta = job ?
    (jobs || []).find(o => o.job_id == job) : null


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
            value={tab}
            aria-label="tabs of data links"
            sx={{marginBottom: '10px'}}
          >
            <Tab
              label={<div className="flex items-center">
                <PublicIcon />&nbsp;Job Status
              </div>}
              component={NavLink}
              className="Mui-Selected"
              to="job-status"
              classes="Mui-Selected"
              replace
            />
            {/* isSignedIn() &&
              <Tab
                label={
                  <div className="flex items-center">
                    <MyJobsIcon/>&nbsp;My Jobs
                  </div>
                }
                value="my-jobs"
                component={NavLink}
                to="/my-jobs"
                replace
              />
            */}

            {tab == 'my-jobs' &&
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


          {tab != 'my-jobs' &&
            <MapContainer>
              {geo &&
                <Map
                  data={selected?.length ? getSubset(selected, geo) : geo}
                  updateID={updateID} />
              }
            </MapContainer>
          }


          {/* tab != 'my-jobs' &&
            <BreadContainer>
              <Breadcrumbs
                separator={<NavigateNextIcon fontSize="small" />}
                aria-label="breadcrumb"
              >
                <Link key="1" to="/jobs/job-status" color={jobName ? 'text.primary' : 'inherit'}>
                  <Chip label="All Jobs"/>
                </Link>
                {jobName &&
                <Typography key="3" color="text.primary">
                  {jobName}
                </Typography>
                }
              </Breadcrumbs>
            </BreadContainer>
          */}

          {tab != 'my-jobs' &&
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
                  value="job-status"
                  component={Link}
                  to="/jobs/job-status"
                  replace
                />
              }

              <Tab
                label={<div className="flex items-center">
                  <TimelineIcon />&nbsp;Timelines
                </div>}
                value="timeline"
                component={Link}
                to="/jobs/timeline"
                replace
              />
            </Tabs>
          }

          {['job-status', 'my-jobs'].includes(tab) && qJobs &&
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
                        to={`timeline?nodes=${selected?.map(o => o.vsn).join(',')}`}
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
                    <div key={i} className="title-row">
                      <div className="flex column">
                        <div>
                          <h2><Link to={`/node/${node_id}`}>{vsn}</Link></h2>
                        </div>
                        <div>{location}</div>
                      </div>
                      <JobTimeLine data={byNode[vsn]} />
                    </div>
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

      {jobMeta &&
        <ConfirmationDialog
          title={`Job Overview`}
          fullScreen
          onConfirm={handleCloseDialog}
          onClose={handleCloseDialog}
          confirmBtnText="Close"
          content={
            <div>
              <JobMetaContainer>
                <MetaTable
                  rows={[
                    {id: 'job_id', label: 'Job ID'},
                    {id: 'user', label: 'User'},
                    {id: 'apps', label: `Apps (${jobMeta.apps.length})`, format: formatters.apps},
                    {id: 'nodes', label: `Nodes (${jobMeta.nodes.length})`,
                      format: formatters.nodes},
                    {id: 'node_tags', label: `Node Tags` , format: (v) => (v || []).join(', ')},
                    {id: 'science_rules', label: `Science Rules`,
                      format: (v) => <pre>{(v || []).join('\n')}</pre>
                    },
                    {id: 'success_criteria', label: `Success Criteria`,
                      format: (v) => <pre>{(v || []).join('\n')}</pre>
                    }
                  ]}
                  data={jobMeta}
                />
              </JobMetaContainer>

              <h2>Timelines</h2>
              {byNode &&
                <TimelineContainer>
                  {Object.keys(byNode)
                    .filter(vsn =>
                      jobs.filter(o => o.id == job).flatMap(o => o.nodes).includes(vsn)
                    )
                    .map((vsn, i) => {
                      const {location, node_id} = manifestByVSN[vsn]
                      return (
                        <div key={i} className="title-row">
                          <div className="flex column">
                            <div>
                              <h2><Link to={`/node/${node_id}`}>{vsn}</Link></h2>
                            </div>
                            <div>{location}</div>
                          </div>
                          <JobTimeLine data={byNode[vsn]} />
                        </div>
                      )
                    })
                  }
                </TimelineContainer>
              }
            </div>
          }
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

const TableOptions = styled.div`
  margin-left: 20px;
`

const JobMetaContainer = styled.div`
  tbody td:first-child {
    width: 120px;
    text-align: right;
  }
`