import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useLocation, NavLink } from 'react-router-dom'
import styled from 'styled-components'

import { Button, ToggleButton, ToggleButtonGroup } from '@mui/material'

import ListIcon from '@mui/icons-material/ListRounded'
import TimelineIcon from '@mui/icons-material/ViewTimelineOutlined'
import PublicIcon from '@mui/icons-material/PieChart'
import AddIcon from '@mui/icons-material/AddRounded'
import MyJobsIcon from '@mui/icons-material/Engineering'
import RemoveIcon from '@mui/icons-material/DeleteOutlineRounded'
import QueuedIcon from '@mui/icons-material/List'
import InProgressIcon from '@mui/icons-material/PlayCircleOutlineRounded'
import CompletedIcon from '@mui/icons-material/CheckOutlined'
import WarningIcon from '@mui/icons-material/WarningOutlined'
import HideIcon from '@mui/icons-material/HideSourceRounded'

import { useSnackbar } from 'notistack'

import ErrorMsg from '/apps/sage/ErrorMsg'

import Map from '/components/Map'
import ConfirmationDialog from '/components/dialogs/ConfirmationDialog'
import Table, { TableSkeleton } from '/components/table/Table'
import { queryData } from '/components/data/queryData'
import { relativeTime } from '/components/utils/units'
import { Tabs, Tab } from '/components/tabs/Tabs'
import { useProgress } from '/components/progress/ProgressProvider'
import { Card } from '/components/layout/Layout'

import JobTimeLine from './JobTimeline'
import JobDetails from './JobDetails'

import * as BK from '/components/apis/beekeeper'
import * as ES from '/components/apis/ses'
import Auth from '/components/auth/auth'

const user = Auth.user



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
    return <Link to={`/jobs/all-jobs?job=${row.id}`}>{val}</Link>
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
  id: 'plugins',
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


// "my jobs" columns are the same as "all jobs", except job details link
const myJobCols = [{
  id: 'name',
  label: 'Name',
  format: (val, row) => {
    return <Link to={`/jobs/my-jobs?job=${row.id}`}>{val}</Link>
  }
},
...jobCols.slice(1)
]


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
  manifests: BK.ManifestMap
) : GeoData {
  return (jobs || [])
    .flatMap(o => o.nodes)
    .map(vsn => ({
      id: vsn,
      vsn,
      lng: Number(manifests[vsn].gps_lon),
      lat: Number(manifests[vsn].gps_lat),
      status: 'reporting'
    }))
}



type State = {
  jobs: ES.Job[]
  pluginEvents?: ES.EventsByNode
  isFiltered?: boolean
  qJobs?: ES.Job[]
  qNodes?: string[]
  selectedNodes?: GeoData
  selectedJobs?: ES.Job[]
}

const initState = {
  jobs: [],
  pluginEvents: null,
  isFiltered: false,
  qJobs: null,
  qNodes: [],
  selectedNodes: [],
  selectedJobs: []
}


type GeoData = {id: BK.VSN, vsn: string, lng: number, lat: number, status: string}[]

type Counts = {public: number, mine: number}


export default function JobStatus() {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()

  const {view = 'all-jobs'} = useParams()

  const params = new URLSearchParams(useLocation().search)
  const query = params.get('query') || '' // query string
  const nodes = params.get('nodes') || '' // vsns
  const job = params.get('job') || ''     // job id

  const {loading, setLoading} = useProgress()

  const [{
    jobs, pluginEvents, isFiltered, qJobs, qNodes, selectedNodes, selectedJobs
  }, setData] = useState<State>(initState)

  // additional meta
  const [manifests, setManifests] = useState<BK.ManifestMap>(null)
  const [geo, setGeo] = useState<GeoData>()
  const [counts, setCounts] = useState<Counts>({
    public: null,
    mine: null,
    queued: 0,
    running: 0,
    completed: 0,
    failed: 0
  })

  // we'll update table columns for each tab
  const [cols, setCols] = useState(jobCols)

  // hack for refreshing map/table
  const [updateMap, setUpdateMap] = useState<number>(0)
  const [updateTable, setUpdateTable] = useState<number>(0)

  // todo(nc): poll data; some optimization is needed
  const [lastUpdate, setLastUpdate] = useState(null)

  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState()


  useEffect(() => {
    if (!jobs || !manifests) return

    const qJobs = queryData<ES.Job>(jobs, query)
    const qNodes = qJobs.flatMap(o => o.nodes)

    setData(prev => ({
      ...prev,
      isFiltered: query.length > 0 || selectedNodes?.length > 0,
      qJobs,
      qNodes
    }))

  }, [query, jobs, manifests, selectedNodes])


  useEffect(() => {
    setLoading(true)

    const filterUser = view == 'my-jobs' && user
    const params = filterUser ? {user} : null

    // fetch aggregated scheduler data
    const p1 = ES.getJobs()

    // also fetch gps for map
    const p2 = BK.getManifest({by: 'vsn'})

    Promise.all([p1, p2])
      .then(([jobs, manifests]) => {
        setManifests(manifests as BK.ManifestMap)

        // todo(nc): remove when VSNs are used for urls
        jobs = jobs.map(o => ({...o, node_ids: o.nodes.map(vsn => manifests[vsn].node_id)}))

        let vsns = [...new Set(jobs.flatMap(o => o.nodes))] as BK.VSN[]

        // if 'my jobs', filter vsns to the user's nodes
        if (filterUser) {
          const nodes = jobs.flatMap(o => o.nodes)
          vsns = vsns.filter(vsn => nodes.includes(vsn))
          jobs = jobs.filter(o => o.user == user)
        }

        // create some geo data
        const geo = vsns.map(vsn => {
          const d = manifests[vsn]
          const lng = d.gps_lon
          const lat = d.gps_lat

          return {...manifests[vsn], id: vsn, vsn, lng, lat, status: 'reporting'}
        })

        setData({jobs})
        setGeo(geo)
      }).catch(err => {
        console.error(err)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [setLoading, view, updateTable])



  // fetch aggreted task event data for timeline (and other stuff later?)
  useEffect(() => {
    if (view != 'timeline') return

    ES.getEvents()
      .then(pluginEvents => setData(prev => ({...prev, pluginEvents})) )
  }, [view])


  // simply update table columns for job lists (for now?)
  useEffect(() => {
    setCols(view == 'all-jobs' ? jobCols : myJobCols)
  }, [view])


  const handleJobSelect = (sel) => {
    const objs = sel.objs.length ? sel.objs : []
    const nodes = jobsToGeos(objs, manifests)

    setData(prev => ({
      ...prev,
      selectedNodes: nodes.length ? nodes : [],
      selectedJobs: objs
    }))
    setUpdateMap(prev => prev + 1)
  }


  const handleQuery = ({query}) => {
    if (query) params.set('query', query)
    else params.delete('query')
    navigate({search: params.toString()}, {replace: true})
  }


  const handleCloseDialog = () => {
    params.delete('job')
    navigate(`/jobs/${view}`, {search: params.toString(), replace: true})
  }


  const handleRemoveJob = () => {
    setLoading(true)
    return ES.removeJobs(selectedJobs.map(o => o.job_id))
      .then(resList => {
        const rmCount = resList.filter(o => o.state == 'Removed').length
        enqueueSnackbar(`${rmCount} jobs removed`, {variant: 'success'})
        setUpdateTable(prev => prev + 1)
      })
      .catch(() => {
        enqueueSnackbar('Failed to remove at least one job', {variant: 'error'})
        setUpdateTable(prev => prev + 1)
      })
      .finally(() => setLoading(false))
  }


  const getSubset = (selectedNodes, nodes) => {
    const ids = selectedNodes.map(o => o.id)
    const subset = nodes.filter(obj => ids.includes(obj.id))
    return subset
  }


  // if query param ?job=<job_id> is provided
  const jobDetails = job ?
    (jobs || []).find(o => o.job_id == job) :
    null


  return (
    <Root>
      <div className="flex">
        <Main className="flex column">
          <MapContainer>
            {geo &&
              <Map
                data={selectedNodes?.length ? getSubset(selectedNodes, geo) : geo}
                updateID={updateMap} />
            }
          </MapContainer>

          <Tabs
            value={view}
            aria-label="job status tabs"
          >
            <Tab
              label={
                <div className="flex items-center">
                  <PublicIcon/>&nbsp;All Jobs ({loading ? '...' : counts.public})
                </div>
              }
              value="all-jobs"
              component={Link}
              to={`/jobs/all-jobs`}
              replace
            />
            {user &&
              <Tab
                label={
                  <div className="flex items-center">
                    <MyJobsIcon/>&nbsp;My Jobs ({loading ? '...' : counts.mine})
                  </div>
                }
                value="my-jobs"
                component={NavLink}
                to="/jobs/my-jobs"
                replace
              />
            }

            <Tab
              label={<div className="flex items-center">
                <TimelineIcon />&nbsp;Timelines
              </div>}
              value="timeline"
              component={Link}
              to={`/jobs/timeline`}
              replace
            />
          </Tabs>

          {loading &&
            <TableSkeleton />
          }

          {['all-jobs', 'my-jobs'].includes(view) && qJobs && !loading &&
            <TableContainer>
              <Table
                primaryKey="id"
                rows={qJobs}
                columns={cols}
                enableSorting
                sort="-submitted"
                onSearch={handleQuery}
                onSelect={handleJobSelect}
                onColumnMenuChange={() => { /* do nothing special */ }}
                checkboxes={view == 'my-jobs'}
                middleComponent={
                  <TableOptions className="flex justify-between">
                    <div>
                      {view == 'my-jobs' && isFiltered &&
                        <Button
                          variant="contained"
                          style={{background: '#c70000'}}
                          onClick={() => setConfirm(true)}
                          startIcon={<RemoveIcon/>}
                        >
                          Remove Job{selectedJobs.length > 1 ? 's' : ''}
                        </Button>
                      }
                    </div>

                    <div className="flex gap">
                      {isFiltered &&
                        <Button
                          variant="contained"
                          component={Link}
                          to={`timeline?nodes=${selectedNodes?.map(o => o.vsn).join(',')}`}
                          startIcon={<TimelineIcon/>}
                        >
                          View timeline{selectedNodes.length > 1 ? 's' : ''}
                        </Button>
                      }
                      {view == 'my-jobs' &&
                        <Button
                          component={Link}
                          to="/create-job"
                          variant="contained"
                          color="primary"
                          startIcon={<AddIcon/>}
                          size="small"
                        >
                          Create job
                        </Button>
                      }
                    </div>
                  </TableOptions>
                }
              />
            </TableContainer>
          }

          {view == 'timeline' && pluginEvents && manifests &&
            <TimelineContainer>
              {Object.keys(pluginEvents)
                .filter(vsn => nodes ? nodes.includes(vsn) : true)
                .map((vsn, i) => {
                  const {location, node_id} = manifests[vsn]
                  return (
                    <Card key={i} className="title-row">
                      <div className="flex column">
                        <div>
                          <h2><Link to={`/node/${node_id}`}>{vsn}</Link></h2>
                        </div>
                        <div>{location}</div>
                      </div>
                      <JobTimeLine data={pluginEvents[vsn]} />
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

      {jobs.length && jobDetails &&
        <JobDetails
          job={jobDetails}
          jobs={jobs}
          manifestByVSN={manifests}
          handleCloseDialog={handleCloseDialog}
        />
      }

      {confirm &&
        <ConfirmationDialog
          title={`Are you sure you want to remove ${selectedJobs.length > 1 ? 'these jobs' : 'this job'}?`}
          content={<p>
            Job{selectedJobs.length > 1 ? 's' : ''} <b>
              {selectedJobs.map(o => o.job_id).join(', ')}
            </b> will be removed!
          </p>}
          confirmBtnText="Remove"
          confirmBtnStyle={{background: '#c70000'}}
          onConfirm={handleRemoveJob}
          onClose={() => setConfirm(false)}
        />
      }
    </Root>
  )
}



const Root = styled.div`
  margin: 10px 20px;
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
  margin: 0 20px;
`

