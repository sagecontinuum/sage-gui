import styled from 'styled-components'
import { Link } from 'react-router-dom'

import ConfirmationDialog from '/components/dialogs/ConfirmationDialog'
import MetaTable from '/components/table/MetaTable'


import { formatters, TimelineContainer } from './JobStatus'

import type {  ByNode, ManifestByVSN } from './JobStatus'
import type { Job } from '/components/apis/ses'

import JobTimeLine from './JobTimeline'


type Props = {
  job: Job
  jobs: Job[]
  byNode: ByNode
  manifestByVSN: ManifestByVSN
  handleCloseDialog: () => void
}

export default function JobDetails(props: Props) {
  const {job, jobs, byNode, manifestByVSN, handleCloseDialog} = props

  return (
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
                {id: 'apps', label: `Apps (${job.apps.length})`, format: formatters.apps},
                {id: 'nodes', label: `Nodes (${job.nodes.length})`,
                  format: formatters.nodes},
                {id: 'node_tags', label: `Node Tags` , format: (v) => (v || []).join(', ')},
                {id: 'science_rules', label: `Science Rules`,
                  format: (v) => <pre>{(v || []).join('\n')}</pre>
                },
                {id: 'success_criteria', label: `Success Criteria`,
                  format: (v) => <pre>{(v || []).join('\n')}</pre>
                }
              ]}
              data={job}
            />
          </JobMetaContainer>

          <h2>Timelines</h2>
          {byNode &&
            <TimelineContainer>
              {Object.keys(byNode)
                .filter(vsn =>
                  jobs.filter(o => o.id == job.job_id).flatMap(o => o.nodes).includes(vsn)
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
  )
}



const JobMetaContainer = styled.div`
  tbody td:first-child {
    width: 120px;
    text-align: right;
  }
`
