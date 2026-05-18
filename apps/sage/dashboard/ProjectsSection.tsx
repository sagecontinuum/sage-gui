import { Link } from 'react-router-dom'
import { styled } from '@mui/material'
import { WorkOutline, ArrowForwardRounded } from '@mui/icons-material'

import { Card } from '/components/layout/Layout'
import Table from '/components/table/Table'
import TableSkeleton from '/components/table/TableSkeleton'
import * as User from '/components/apis/user'

import config from '/config'
const { contactUs } = config


type ProjectsSectionProps = {
  projects: User.Project[]
}


const projectColumns = [{
  id: 'name',
  label: 'Project',
  format: (name, obj) => <Link to={`/my-teams/${obj.name}`}><b>{name}</b></Link>
}, {
  id: 'nodes',
  label: 'Nodes',
  format: (nodes) => nodes.length
}, {
  id: 'members',
  label: 'Members',
  format: (members, obj) =>
    <Link to={`/my-teams/${obj.name}`}>
      {members.length}
    </Link>
}]


export default function ProjectsSection({ projects }: ProjectsSectionProps) {
  return (
    <Section>
      <Card>
        <SectionHeader>
          <SectionTitle>
            <WorkOutline /> My Projects
          </SectionTitle>
          {projects && projects.length > 0 &&
            <ViewAllLink to="/my-projects">
              View All <ArrowForwardRounded fontSize="small" />
            </ViewAllLink>
          }
        </SectionHeader>
        {!projects ? (
          <TableSkeleton noSearch rows={3} />
        ) : projects.length > 0 ? (
          <Table
            primaryKey="name"
            columns={projectColumns}
            rows={projects}
            pagination={false}
            enableSorting={false}
          />
        ) : (
          <EmptyState>
            <EmptyIcon><WorkOutline /></EmptyIcon>
            <div>
              It looks like you do not have access to any projects.<br/>
              Please <b><a href="/request-access">Request Access</a></b> or <b><a href={contactUs}>Contact Us</a></b> if
              interested<br/> in using Sage or collaborating with us.
            </div>
          </EmptyState>
        )}
      </Card>
    </Section>
  )
}


const Section = styled('div')`
  /* Card styles handled by Card component */
`

const SectionHeader = styled('div')`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid ${({ theme }) => theme.palette.mode === 'dark' ? '#444' : '#e0e0e0'};
`

const SectionTitle = styled('h2')`
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25em;
  color: ${({ theme }) => theme.palette.mode === 'dark' ? '#fff' : '#333'};

  svg {
    color: ${({ theme }) => theme.palette.primary.main};
  }
`

const ViewAllLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: ${({ theme }) => theme.palette.primary.main};
  text-decoration: none;
  font-size: 0.9em;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    gap: 0.5rem;
    text-decoration: underline;
  }

  svg {
    transition: transform 0.2s ease;
  }

  &:hover svg {
    transform: translateX(4px);
  }
`

const EmptyState = styled('div')`
  text-align: center;
  padding: 3rem 1rem;
  color: ${({ theme }) => theme.palette.text.secondary};

  p {
    margin: 1rem 0;
    font-size: 1.1em;
  }

  a {
    color: ${({ theme }) => theme.palette.primary.main};
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`

const EmptyIcon = styled('div')`
  svg {
    font-size: 4em;
    opacity: 0.3;
  }
`
