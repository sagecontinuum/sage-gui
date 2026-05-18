import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { styled } from '@mui/material'
import MuiLink from '@mui/material/Link'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Typography from '@mui/material/Typography'
import { useProgress } from '/components/progress/ProgressProvider'

import HubOutlinedIcon from '@mui/icons-material/HubOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import WorkOutlineIcon from '@mui/icons-material/WorkOutline'

import Table from '/components/table/Table'
import MetricStatCard from '/components/layout/MetricStatCard'
import * as User from '/components/apis/user'
import ErrorMsg from '/apps/sage/ErrorMsg'


type Member = {
  username: string
  name: string
}


const columns = [{
  id: 'name',
  label: 'Name',
  format: (name) => name || '-'
}, {
  id: 'username',
  label: 'Username',
  format: (username) => <code>{username}</code>
}]


export default function Members() {
  const { projectName } = useParams()
  const {setLoading} = useProgress()

  const [data, setData] = useState<Member[]>()
  const [project, setProject] = useState<User.MyProject>()
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)

    User.listMyProjects()
      .then(({projects}) => {
        const project = projects.find(p => p.name === projectName)
        if (project) {
          setProject(project)
          setData(project.members)
        } else {
          setError(new Error(`Project "${projectName}" not found`))
        }
      })
      .catch(error => setError(error))
      .finally(() => setLoading(false))

  }, [setLoading, projectName])

  return (
    <Root>
      <Breadcrumbs aria-label="breadcrumb">
        <MuiLink component={Link} underline="hover" to="/my-projects">
          <span className="flex items-center">
            <WorkOutlineIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Projects
          </span>
        </MuiLink>
        <Typography color="text.primary">{projectName}</Typography>
      </Breadcrumbs>
      <br/>

      <Header>
        <h1 className="no-margin">
          {projectName} Team Members
        </h1>
        <StatsContainer>
          <MetricStatCard
            icon={<HubOutlinedIcon />}
            value={project?.nodes?.length || 0}
            label={`Node${project?.nodes?.length === 1 ? '' : 's'}`}
          />
          <MetricStatCard
            icon={<GroupOutlinedIcon />}
            value={project?.members?.length || 0}
            label={`Member${project?.members?.length === 1 ? '' : 's'}`}
          />
        </StatsContainer>
      </Header>
      <br/>

      {data &&
        <Table
          primaryKey="username"
          enableSorting
          columns={columns}
          rows={data}
          emptyNotice={<div>
            No members found for this project.
          </div>}
        />
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

const Header = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`

const StatsContainer = styled('div')`
  display: grid;
  grid-template-columns: repeat(2, minmax(180px, 1fr));
  gap: 0.75rem;
  min-width: min(420px, 100%);
`
