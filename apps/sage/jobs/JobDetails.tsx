import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

import { Divider, IconButton, Tooltip } from '@mui/material'
import FileDownloadRounded from '@mui/icons-material/FileDownloadRounded'
import TerminalRounded from '@mui/icons-material/TerminalRounded'
import TableView from '@mui/icons-material/TableViewRounded'
import EditRounded from '@mui/icons-material/EditRounded'
import CloudDownloadOutlined from '@mui/icons-material/CloudDownloadOutlined'

import ParamDetails from './ParamDetails'

import ConfirmationDialog from '/components/dialogs/ConfirmationDialog'
import MetaTable from '/components/table/MetaTable'
import Clipboard from '/components/utils/Clipboard'
import { useProgress } from '/components/progress/ProgressProvider'

import { formatters, TimelineContainer } from './JobStatus'

import type { ManifestByVSN } from './JobStatus'
import type { Job } from '/components/apis/ses'

import JobTimeLine from './JobTimeline'

import * as ES from '/components/apis/ses'



type Props = {
  job: Job
  jobs: Job[]
  manifestByVSN: ManifestByVSN
  handleCloseDialog: () => void
}

export default function JobDetails(props: Props) {
  const {job, jobs, manifestByVSN, handleCloseDialog} = props

  const {setLoading} = useProgress()
  const [eventsByNode, setEventsByNode] = useState<ES.EventsByNode>()
  const [yaml, setYaml] = useState<string>(null)

  useEffect(() => {
    if (!job) return

    setLoading(true)
    ES.getEvents(job.nodes)
      .then(data => setEventsByNode(data))
      .finally(() => setLoading(false))
  }, [])


  const handleViewYaml = () => {
    if (yaml) {
      setYaml(null)
      return
    }

    ES.getTemplate(job.job_id, 'yaml')
      .then(yaml => setYaml(yaml as string))
      .catch(error => setYaml(error.message))
  }


  const handleDownload = () => {
    ES.downloadTemplate(job.job_id)
  }

  return (
    <ConfirmationDialog
      title={
        <div className="flex">
          <div>
            Job Overview
          </div>
          <Divider orientation="vertical" flexItem sx={{margin: '5px 10px'}}/>
          <Tooltip title={yaml ? 'Show table' : 'Show YAML'}>
            <IconButton onClick={handleViewYaml}>
              {yaml ? <TableView /> : <TerminalRounded />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Download spec">
            <IconButton onClick={handleDownload}>
              <CloudDownloadOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title="Recreate job (experimental!)">
            <IconButton component={Link} to={`/create-job?tab=editor&start_with_job=${job.job_id}`}>
              <EditRounded fontSize="small"/>
            </IconButton>
          </Tooltip>
        </div>
      }
      fullScreen
      onConfirm={handleCloseDialog}
      onClose={handleCloseDialog}
      confirmBtnText="Close"
      content={
        <div>
          <JobMetaContainer>
            {yaml &&
              <Clipboard content={yaml} />
            }

            {!yaml &&
              <MetaTable
                rows={[
                  {
                    id: 'job_id',
                    label: 'Job ID'
                  }, {
                    id: 'user',
                    label: 'User'
                  }, {
                    id: 'plugins',
                    label: `Apps (${job.plugins.length})`,
                    format: formatters.apps
                  }, {
                    id: 'nodes',
                    label: `Nodes (${job.nodes.length})`,
                    format: formatters.nodes
                  }, {
                    id: 'node_tags',
                    label: `Node Tags`,
                    format: (v) => (v || []).join(', ')
                  }, {
                    id: 'plugins',
                    label: `Params`,
                    format: (v) => <ParamDetails data={v} />
                  }, {
                    id: 'science_rules',
                    label: `Science Rules`,
                    format: (v) => <pre>{(v || []).join('\n')}</pre>
                  }, {
                    id: 'success_criteria',
                    label: `Success Criteria`,
                    format: (v) => <pre>{(v || []).join('\n')}</pre>
                  }
                ]}
                data={job}
              />
            }
          </JobMetaContainer>

          <h2>Timelines</h2>
          {eventsByNode &&
            <TimelineContainer>
              {Object.keys(eventsByNode)
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
                      <JobTimeLine data={eventsByNode[vsn]} />
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
    vertical-align: top;
  }

  td > pre {
    margin: 0;
  }
`
