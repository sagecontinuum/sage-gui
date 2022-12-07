import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useLocation, NavLink } from 'react-router-dom'
import styled from 'styled-components'

import { Button } from '@mui/material'

import ListIcon from '@mui/icons-material/ListRounded'
import TimelineIcon from '@mui/icons-material/ViewTimelineOutlined'
import PublicIcon from '@mui/icons-material/PieChart'
import AddIcon from '@mui/icons-material/AddRounded'
import MyJobsIcon from '@mui/icons-material/Engineering'
import RemoveIcon from '@mui/icons-material/DeleteOutlineRounded'

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
  manifestByVSN: ManifestByVSN
) : GeoData {
  return (jobs || [])
    .flatMap(o => o.nodes)
    .map(vsn => ({
      id: vsn,
      vsn,
      lng: Number(manifestByVSN[vsn].gps_lon),
      lat: Number(manifestByVSN[vsn].gps_lat),
      status: 'reporting'
    }))
}


export type ByNode = {[vsn: string]: ES.PluginEvent[]}

type State = {
  jobs: ES.Job[]
  byNode: ByNode | {}
  isFiltered: boolean
  qJobs: ES.Job[]
  qNodes: string[]
  selectedNodes: GeoData
  selectedJobs: ES.Job[]
}

const initState = {
  jobs: [],
  byNode: {},
  isFiltered: false,
  qJobs: null,
  qNodes: [],
  selectedNodes: [],
  selectedJobs: []
}


type ManifestByVSN = {[vsn: string]: BK.Manifest}

type GeoData = {id: string, vsn: string, lng: number, lat: number, status: string}[]

export default function JobStatus(props) {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()

  const {view = 'all-jobs'} = useParams()

  const params = new URLSearchParams(useLocation().search)
  const query = params.get('query') || ''
  const nodes = params.get('nodes') || ''
  const job = params.get('job') || ''
  const tab = params.get('tab') || 'jobs'

  const {loading, setLoading} = useProgress()

  const [{
    jobs, byNode, isFiltered, qJobs, qNodes, selectedNodes, selectedJobs
  }, setData] = useState<State>(initState)

  // additional meta
  const [manifestByVSN, setManifestByVSN] = useState<ManifestByVSN>()
  const [geo, setGeo] = useState<GeoData>()

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
    if (!jobs || !manifestByVSN) return

    const qJobs = queryData<ES.Job>(jobs, query)
    const qNodes = qJobs.flatMap(o => o.nodes)

    setData(prev => ({
      ...prev,
      isFiltered: query.length > 0 || selectedNodes?.length > 0,
      qJobs,
      qNodes
    }))

  }, [query, jobs, manifestByVSN, selectedNodes])


  useEffect(() => {
    setLoading(true)

    const filterUser = view == 'my-jobs' && user
    const params = filterUser ? {user} : null

    // fetch scheduler data
    const p1 = ES.getAllData(params)

    // also fetch gps for map
    const p2 = BK.getManifest({by: 'vsn'})

    Promise.all([p1, p2])
      .then(([{jobs, byNode}, data]) => {
        setManifestByVSN(data)

        // todo(nc): remove when VSNs are used for urls
        jobs = jobs.map(o => ({...o, node_ids: o.nodes.map(vsn => data[vsn].node_id)}))

        setData({jobs, byNode})

        let vsns = Object.keys(byNode)

        // if 'my jobs', filter vsns to the user's nodes
        if (filterUser) {
          const nodes = jobs.flatMap(o => o.nodes)
          vsns = vsns.filter(vsn => nodes.includes(vsn))
        }

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
  }, [setLoading, view, updateTable])


  // simply update table columns for job lists (for now?)
  useEffect(() => {
    setCols(view == 'all-jobs' ? jobCols : myJobCols)
  }, [view])


  const handleJobSelect = (sel) => {
    const objs = sel.objs.length ? sel.objs : []
    const nodes = jobsToGeos(objs, manifestByVSN)


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
    navigate(`/jobs/${view}?tab=${tab}`, {search: params.toString(), replace: true})
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
          <Tabs
            value={view}
            aria-label="tabs of data links"
            sx={{marginBottom: '10px'}}
          >
            <Tab
              label={<div className="flex items-center">
                <PublicIcon />&nbsp;All Jobs
              </div>}
              component={NavLink}
              value="all-jobs"
              to="/jobs/all-jobs"
              replace
            />
            {user &&
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
          </Tabs>

          <MapContainer>
            {geo &&
              <Map
                data={selectedNodes?.length ? getSubset(selectedNodes, geo) : geo}
                updateID={updateMap} />
            }
          </MapContainer>

          <Tabs
            value={tab}
            aria-label="job status tabs"
          >
            <Tab
              label={
                <div className="flex items-center">
                  <ListIcon/>&nbsp;{view == 'my-jobs' ? 'My Jobs' : 'Jobs'} ({loading ? '...' : jobs.length})
                </div>
              }
              value="jobs"
              component={Link}
              to={`/jobs/${view}?tab=jobs`}
              replace
            />
            <Tab
              label={<div className="flex items-center">
                <TimelineIcon />&nbsp;{view == 'my-jobs' ? 'My Timelines' : 'Timelines'}
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
                columns={cols}
                enableSorting
                sort="-submitted"
                onSearch={handleQuery}
                onSelect={handleJobSelect}
                onColumnMenuChange={() => { /* do nothing special */ }}
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
                          to={`?tab=timeline&nodes=${selectedNodes?.map(o => o.vsn).join(',')}`}
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

      {jobDetails && byNode &&
        <JobDetails
          job={jobDetails}
          jobs={jobs}
          byNode={byNode}
          manifestByVSN={manifestByVSN}
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

