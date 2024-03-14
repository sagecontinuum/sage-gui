// @ts-nocheck -- type checking for timeline is still a todo
import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

import { Button, Divider, FormControlLabel, IconButton, Tooltip } from '@mui/material'
import EditIcon from '@mui/icons-material/EditRounded'
import TerminalRounded from '@mui/icons-material/TerminalRounded'
import TableView from '@mui/icons-material/TableViewRounded'
import CloudDownloadOutlined from '@mui/icons-material/CloudDownloadOutlined'

import ParamDetails from './ParamDetails'

import ConfirmationDialog from '/components/dialogs/ConfirmationDialog'
import MetaTable from '/components/table/MetaTable'
import Clipboard from '/components/utils/Clipboard'
import Checkbox from '/components/input/Checkbox'
import { useProgress } from '/components/progress/ProgressProvider'

import { formatters } from './JobStatus'
import JobTimeline from './JobTimeline'

import * as ES from '/components/apis/ses'
// import { type NodeMeta } from '/components/apis/beekeeper' // todo(nc)
import DataOptions from '/components/input/DataOptions'
import TimelineContainer from '/components/viz/TimelineContainer'
import TimelineSkeleton from '/components/viz/TimelineSkeleton'
import { quickRanges } from '/components/utils/units'

import { pickBy } from 'lodash'
import { subDays  } from 'date-fns'


const TAIL_DAYS = '-1d'


const getStartTime = (str) =>
  subDays(new Date(), str.replace(/-|d/g, ''))


type Options = {
  start: Date
  window: string
}



type Props = {
  job: ES.Job
  nodeMetaByVSN: {[vsn: string]: object} // todo(nc): type after migration
  handleCloseDialog: () => void
}

export default function JobDetails(props: Props) {
  const {job, nodeMetaByVSN, handleCloseDialog} = props

  const {loading, setLoading} = useProgress()
  const [yaml, setYaml] = useState<string>()

  const [eventsByNode, setEventsByNode] = useState<ES.EventsByNode>()
  const [errorsByGoalID, setErrorsByGoalID] = useState<ES.ErrorsByGoalID>()

  // all events related to the job being looked at (by node)
  const [events, setEvents] = useState<ES.EventsByNode>()

  const [showAllTasks, setShowAllTasks] = useState<boolean>(false)

  const [opts, setOpts] = useState<Options>({
    start: getStartTime(TAIL_DAYS),
    window: TAIL_DAYS
  })


  useEffect(() => {
    if (!job) return

    const {start} = opts

    setLoading(true)
    ES.getEvents({vsns: job.nodes, start})
      .then(({events, errors}) => {
        setEventsByNode(events)
        setErrorsByGoalID(errors)
      })
      .finally(() => setLoading(false))
  }, [job, setLoading, opts])


  useEffect(() => {
    if (!eventsByNode || !job) return

    if (showAllTasks) {
      setEvents(eventsByNode)
    } else {
      const taskNames = job.plugins.map(o => o.name)

      // filter to relevant tasks (by node)
      const byNode = {}
      Object.keys(eventsByNode).forEach(vsn => {
        byNode[vsn] = pickBy(eventsByNode[vsn], (_, key) => taskNames.includes(key))
      })

      setEvents(byNode)
    }
  }, [job, eventsByNode, showAllTasks])


  const handleViewYaml = () => {
    if (yaml) {
      setYaml(null)
      return
    }

    ES.getTemplate(job.job_id, 'yaml')
      .then(yaml => setYaml(yaml as string))
      .catch(error => setYaml(error.message))
  }

  const handleOptionChange = (name, val) => {
    if (name == 'window') {
      setOpts(prev => ({
        ...prev,
        ...(val && {window: val, start: getStartTime(val)})
      }))
    } else {
      throw `unhandled option state change name=${name}`
    }
  }

  const handleDownload = () => {
    ES.downloadTemplate(job.job_id)
  }


  const dayCount = opts.window.replace(/-|d/g, '')

  return (
    <ConfirmationDialog
      title={
        <div className="flex items-center">
          <div>
            Job Overview
          </div>
          <Divider orientation="vertical" flexItem sx={{margin: '5px 10px'}}/>
          <Button
            component={Link}
            variant="contained"
            startIcon={<EditIcon/>}
            size="small"
            to={`/create-job?tab=editor&start_with_job=${job.job_id}`}>
            Recreate or edit job
          </Button>
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
        </div>
      }
      fullScreen
      onConfirm={handleCloseDialog}
      onClose={handleCloseDialog}
      confirmBtnText="Close"
      content={
        <Content>
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
                    id: 'params',
                    label: `Params`,
                    format: (v, obj) => <ParamDetails data={obj.plugins} />
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


          <div className="timeline-title flex items-center gap">
            <h2 className="no-margin">
              Last {dayCount == '1' ? 'day' : `${dayCount} days`} of events
            </h2>
            <DataOptions
              quickRanges={['-90d', '-30d', '-7d', '-2d', '-1d']}
              onChange={handleOptionChange}
              opts={opts}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={showAllTasks}
                  onChange={(evt) => setShowAllTasks(evt.target.checked)}
                />
              }
              label="Show all tasks"
            />
          </div>

          {!events &&
            <TimelineSkeleton />
          }

          {events &&
            Object.keys(events)
              .map((vsn) => {
                const {address} = nodeMetaByVSN[vsn]
                const data = events[vsn]

                return (
                  <TimelineContainer key={vsn}>
                    <div className="title-row">
                      <div className="flex column">
                        <div>
                          <h2><Link to={`/node/${vsn}`}>{vsn}</Link></h2>
                        </div>
                        <div>{address}</div>
                      </div>

                      {loading &&
                      <div className="w-full">
                        <TimelineSkeleton includeHeader={false} />
                      </div>
                      }

                      {!loading && !Object.keys(data).length &&
                      <p className="muted">
                        {!showAllTasks &&
                          <>No events found for this job (for the {quickRanges[opts.window]}).</>
                        }
                        {showAllTasks &&
                          <>No events found for the {quickRanges[opts.window]}.</>
                        }
                      </p>
                      }
                      {!loading && Object.keys(data).length > 0 &&
                        <JobTimeline data={data} errors={errorsByGoalID} start={opts.start} />
                      }
                    </div>
                  </TimelineContainer>
                )
              })
          }

        </Content>
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

const Content = styled.div`
  .timeline-title {
    margin-top: 2rem;
  }
`
