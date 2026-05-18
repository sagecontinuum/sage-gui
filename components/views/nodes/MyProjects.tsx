import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { styled } from '@mui/material'
import { WorkOutline, HubOutlined, GroupOutlined } from '@mui/icons-material'
import { useProgress } from '/components/progress/ProgressProvider'
import MetricStatCard from '/components/layout/MetricStatCard'

import Table from '/components/table/Table'
import * as User from '/components/apis/user'
import ErrorMsg from '/apps/sage/ErrorMsg'

import config from '/config'
const { contactUs } = config


const columns = [{
  id: 'name',
  label: 'Project Name',
  format: (name) =>
    <Link to={`/my-teams/${encodeURIComponent(name)}`}>
      <b>{name}</b>
    </Link>
}, {
  id: 'nodes',
  label: 'Nodes',
  format: (nodes, obj) =>
    <Link to={`/my-nodes?show_all=true&project=${encodeURIComponent(obj.name)}`}>
      {nodes.length}
    </Link>
}, {
  id: 'members',
  label: 'Team Members',
  format: (members, obj) =>
    <Link to={`/my-teams/${encodeURIComponent(obj.name)}`}>
      {members.length} {members.length === 1 ? 'member' : 'members'}
    </Link>
}]


export default function MyProjects() {
  const {setLoading} = useProgress()

  const [data, setData] = useState<User.MyProject[]>()
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)

    User.listMyProjects()
      .then(({projects}) => setData(projects))
      .catch(error => setError(error))
      .finally(() => setLoading(false))

  }, [setLoading])

  // Calculate unique counts
  const uniqueNodes = data ? new Set(data.flatMap(p => p.nodes.map(n => n.vsn))).size : 0
  const uniqueMembers = data ? new Set(data.flatMap(p => p.members.map(m => m.username))).size : 0

  return (
    <Root>
      <h1 className="no-margin">My Projects</h1>
      <br/>

      {data &&
        <>
          <StatsContainer>
            <MetricStatCard
              icon={<WorkOutline />}
              value={data.length}
              label={`Project${data.length !== 1 ? 's' : ''}`}
            />
            <MetricStatCard
              icon={<HubOutlined />}
              value={uniqueNodes}
              label={`Unique node${uniqueNodes !== 1 ? 's' : ''}`}
            />
            <MetricStatCard
              icon={<GroupOutlined />}
              value={uniqueMembers}
              label={`Team member${uniqueMembers !== 1 ? 's' : ''}`}
            />
          </StatsContainer>

          <Table
            primaryKey="name"
            enableSorting
            columns={columns}
            rows={data}
            emptyNotice={
              <div>
              It looks like you do not have access to any projects.<br/>
              Please <b><a href="/request-access">Request Access</a></b> or <b><a href={contactUs}>Contact Us</a></b> if
              interested<br/> in collaborating with Sage.
              </div>
            }
          />
        </>
      }

      {error &&
        <ErrorMsg>{error.message}</ErrorMsg>
      }
    </Root>
  )
}

const Root = styled('div')`
  margin-top: 2rem;
`

const StatsContainer = styled('div')`
  display: flex;
  gap: 20px;
  margin-bottom: 30px;

  > * {
    flex: 1;
  }
`
