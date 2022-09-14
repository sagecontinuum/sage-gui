import { useEffect, useState } from 'react'
import styled from 'styled-components'

import Alert from '@mui/material/Alert'

import Map from '/components/Map'
import Table from '/components/table/Table'
import JobTimeLine from './JobTimeline'
import Sidebar from '../data-commons/DataSidebar'

import { getGoals, getPluginEvents, reduceData } from './jobParser'

import * as BK from '/components/apis/beekeeper'
import * as BH from '/components/apis/beehive'
import { useProgress } from '/components/progress/ProgressProvider'


const columns = [{
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
  const {setLoading} = useProgress()

  const [goals, setGoals] = useState<BH.Record[]>()
  const [byNode, setByNode] = useState()
  const [geo, setGeo] = useState<GeoData>()

  const [error, setError] = useState()

  useEffect(() => {
    setLoading(true)

    Promise.all([getPluginEvents(), getGoals()])
      .then(([taskEvents, goalEvents]) => {
        const {byNode, goals} = reduceData(taskEvents, goalEvents)

        setByNode(byNode)
        setGoals(goals)

        // also fetch gps for map
        BK.getManifest({by: 'vsn'})
          .then(data => {
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


  const handleSelect = () => {
    // todo
  }

  return (
    <Root>
      <div className="flex">
        <CustomSidebar width="275px">
          <h2>Science Goals</h2>
          <TableContainer>
            {goals &&
              <Table
                primaryKey="goalID"
                rows={goals}
                columns={columns}
                enableSorting
                onSearch={() => {}}
                onSelect={handleSelect}
              />
            }
          </TableContainer>
        </CustomSidebar>

        <Main className="flex column">
          <MapContainer>
            {geo &&
              <Map data={geo} selected={null} resize={false} updateID={null} />
            }
          </MapContainer>

          <TimelineContainer>
            {byNode && Object.keys(byNode).map((node, i) =>
              <div key={i}>
                <h4>{node}</h4>
                <JobTimeLine data={byNode[node]} />
              </div>
            )}
          </TimelineContainer>

          {error &&
            <Alert severity="error">{error.message}</Alert>
          }
        </Main>
      </div>
    </Root>
  )
}



const Root = styled.div`

`

const CustomSidebar = styled(Sidebar)`
  padding: 0 10px;
`

const Main = styled.div`
  width: 100%;
  margin-bottom: 1400px;
`

const MapContainer = styled.div`
  width: 100%;
`

const TimelineContainer = styled.div`
  padding: 0 1.2em;

  h4 {
    float: left;
    margin: 5px;
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