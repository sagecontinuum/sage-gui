import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'

import Alert from '@mui/material/Alert'

import Map from '/components/Map'
import Table from '/components/table/Table'
import JobTimeLine from './JobTimeline'

import { Sidebar, Top, Controls, Divider } from '../common/Layout'
import {Tabs, Tab} from '/components/tabs/Tabs'
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
  format: (val) => <Link to={`/job-status/jobs/${val}`}>{val}</Link>
}, {
  id: 'id',
  label: 'ID'
}, {
  id: 'status',
  label: 'Status'
}, {
  id: 'nodeInfo',
  label: 'Nodes',
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



type GeoData = {id: string, lng: number, lat: number}[]

export default function JobStatus() {
  const {tab} = useParams()
  const {setLoading} = useProgress()

  const [{jobs, goals, byNode}, setData] = useState<{
    jobs: ES.Job[],
    goals: ES.Goal[],
    byNode: {[vsn: string]: ES.PluginEvent[]}
  }>({})

  // additional meta
  const [manifestByVSN, setManifestByVSN] = useState<{[vsn: string]: BK.Manifest}>()
  const [geo, setGeo] = useState<GeoData>()

  const [error, setError] = useState()

  const [tabID, setTabID] = useState(tab || 'jobs')

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
      .then(({jobs, goals, byNode}) => {
        setData({jobs, goals, byNode})

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
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [setLoading])


  const handleJobSelect = (objs) => {
    console.log('objs', objs)
  }

  const handleGoalSelect = (objs) => {
    // todo
  }

  const handleOptionChange = () => {

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
              <Map data={geo} selected={null} resize={false} updateID={null} />
            }
          </MapContainer>

          <Tabs
            value={tabID}
            onChange={(_, idx) => setTabID(idx)}
            aria-label="tabs of data links"
          >
            <Tab
              label={
                <div className="flex items-center">
                  Job List
                </div>
              }
              value="jobs"
              component={Link}
              to="/job-status/jobs"
              replace
            />
            <Tab
              label={
                <div className="flex items-center">
                  Sub Goals
                </div>
              }
              value="goals"
              component={Link}
              to="/job-status/goals"
              replace
            />
            <Tab
              label={<div className="flex items-center">Timelines</div>}
              value="timeline"
              component={Link}
              to="/job-status/timeline"
              replace
            />
          </Tabs>

          {tabID == 'jobs' && jobs &&
            <TableContainer>
              <Table
                primaryKey="id"
                rows={jobs}
                columns={jobCols}
                enableSorting
                onSelect={handleJobSelect}
              />
            </TableContainer>
          }

          {tabID == 'goals' && goals &&
            <TableContainer>
              <Table
                primaryKey="id"
                rows={goals}
                columns={goalCols}
                enableSorting
                onSelect={handleGoalSelect}
              />
            </TableContainer>
          }

          {tabID == 'timeline' && byNode && manifestByVSN &&
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
            <Alert severity="error">{error.message}</Alert>
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

    tr:nth-child(odd) {
      background: none;
    }
    tr.MuiTableRow-root:hover {
      background-color: initial;
    }
  }

  .MuiInputBase-root {
    color: #aaa;
    pointer-events: none;
    background: #f2f2f2;
  }

  .MuiFormControl-root:hover {
    cursor: not-allowed;
  }
`