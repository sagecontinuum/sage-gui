// @ts-nocheck -- type checking for timeline is still a todo
import { useEffect, useState } from 'react'
import { styled } from '@mui/material'
import { Link } from 'react-router-dom'

import { Button, ButtonGroup, Divider, Drawer, FormControlLabel, IconButton, Tooltip } from '@mui/material'
import EditIcon from '@mui/icons-material/EditRounded'
import TerminalRounded from '@mui/icons-material/TerminalRounded'
import TableView from '@mui/icons-material/TableViewRounded'
import CloudDownloadOutlined from '@mui/icons-material/CloudDownloadOutlined'

import ParamDetails from './ParamDetails'

import CloseIcon from '@mui/icons-material/CloseRounded'
import MetaTable from '/components/table/MetaTable'
import Checkbox from '/components/input/Checkbox'
import { Card } from '/components/layout/Layout'

import YamlViewer from './YamlViewer'

import { formatters } from './JobStatus'

import TimelineIcon from '@mui/icons-material/ViewTimelineOutlined'
import ListIcon from '@mui/icons-material/ListAltRounded'
import JobTimeline from './JobTimeline'
import ListTasks from './ListTasks'

import * as ES from '/components/apis/ses'
// import { type NodeMeta } from '/components/apis/beekeeper' // todo(nc)
import DataOptions from '/components/input/DataOptions'
import TimelineContainer from '/components/viz/TimelineContainer'
import TimelineSkeleton from '/components/viz/TimelineSkeleton'
import { quickRanges } from '/components/utils/units'

import { pickBy } from 'lodash'
import { subDays  } from 'date-fns'
import ErrorMsg from '../ErrorMsg'


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

  const [tab, setTab] = useState<'timeline' | 'tasks'>('timeline')
  const [view, setView] = useState<'yaml' | 'table'>('yaml')

  const [yaml, setYaml] = useState<string>()

  // fetch YAML by default when job changes
  useEffect(() => {
    if (!job) return
    ES.getTemplate(job.job_id, 'yaml')
      .then(y => setYaml(y as string))
      .catch(() => setYaml(null))
  }, [job])

  const [eventsByNode, setEventsByNode] = useState<ES.EventsByNode>()
  const [errorsByGoalID, setErrorsByGoalID] = useState<ES.ErrorsByGoalID>()
  const [error, setError] = useState<string>()

  // all events related to the job being looked at (by node)
  const [events, setEvents] = useState<ES.EventsByNode>()
  const [showAllTasks, setShowAllTasks] = useState<boolean>(false)

  const [opts, setOpts] = useState<Options>({
    start: getStartTime(TAIL_DAYS),
    window: TAIL_DAYS
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!job) return

    const {start} = opts

    setLoading(true)
    ES.getEvents({vsns: job.nodes, start})
      .then(({events, errors}) => {
        setEventsByNode(events)
        setErrorsByGoalID(errors)
      })
      .catch(error => setError(error.message))
      .finally(() => setLoading(false))
  }, [job, opts])


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

  // build lookup sets for linking
  const nodeSet = new Set<string>(job.nodes || [])


  const dayCount = opts.window.replace(/-|d/g, '')

  return (
    <Drawer
      anchor="right"
      open={!!job}
      onClose={handleCloseDialog}
      PaperProps={{sx: {
        width: {xs: '100%', md: '90%', lg: '85%'},
        marginTop: '60px',
        height: 'calc(100% - 60px)',
        overflowY: 'auto',
      }}}
      slotProps={{backdrop: {sx: {backgroundColor: 'rgba(0,0,0,0.12)'}}}}
    >
      <DrawerHeader className="flex items-center">
        <div className="flex items-center" style={{flex: 1}}>
          <h2 className="no-margin">
            Job Overview
          </h2>
          <Divider orientation="vertical" flexItem sx={{margin: '5px 10px'}}/>
          <Button
            component={Link}
            variant="contained"
            startIcon={<EditIcon/>}
            size="small"
            to={`/jobs/create-job?tab=editor&start_with_job=${job.job_id}`}>
            Recreate or edit job
          </Button>
          <Divider orientation="vertical" flexItem sx={{margin: '5px 10px'}}/>
          <Tooltip title="Download spec">
            <IconButton onClick={handleDownload}>
              <CloudDownloadOutlined />
            </IconButton>
          </Tooltip>
        </div>
        <Tooltip title="Close">
          <IconButton onClick={handleCloseDialog}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </DrawerHeader>
      <Content>
        <Card>
          <SectionHeader>
            <SectionTitle>
              Job Spec
            </SectionTitle>
            <HeaderDivider />
            <ButtonGroup size="small" variant="outlined">
              <Button
                onClick={() => setView('yaml')}
                variant={view === 'yaml' ? 'contained' : 'outlined'}
                startIcon={<TerminalRounded />}
              >
                YAML
              </Button>
              <Button
                onClick={() => setView('table')}
                variant={view === 'table' ? 'contained' : 'outlined'}
                startIcon={<TableView />}
              >
                Table
              </Button>
            </ButtonGroup>
          </SectionHeader>
          <JobMetaBody>
            {view === 'yaml' && yaml &&
              <YamlViewer
                code={yaml}
                nodeSet={nodeSet}
              />
            }

            {view === 'table' &&
            <MetaTable
              rows={[
                {
                  id: 'job_id',
                  label: 'Job ID'
                }, {
                  id: 'user',
                  label: 'User'
                }, {
                  id: 'apps',
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
          </JobMetaBody>
        </Card>

        <Card>
          <SectionHeader>
            <SectionTitle>
              Events
            </SectionTitle>
            <HeaderDivider />
            <ButtonGroup size="small" variant="outlined">
              <Button
                onClick={() => setTab('timeline')}
                variant={tab === 'timeline' ? 'contained' : 'outlined'}
                startIcon={<TimelineIcon />}
              >
                Timeline
              </Button>
              <Button
                onClick={() => setTab('tasks')}
                variant={tab === 'tasks' ? 'contained' : 'outlined'}
                startIcon={<ListIcon />}
              >
                Task List
              </Button>
            </ButtonGroup>
          </SectionHeader>

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

          {tab == 'tasks' &&
            <ListTasks job={job} start={opts.start} showAllTasks={showAllTasks} />
          }

          {tab == 'timeline' && !events && loading &&
            <TimelineSkeleton />
          }

          {error && <ErrorMsg>{error}</ErrorMsg>}

          {tab == 'timeline' && events &&
            Object.keys(events)
              .map((vsn) => {
                const {address} = nodeMetaByVSN[vsn]
                const data = events[vsn]

                return (
                  <TimelineContainer key={vsn}>
                    <div className="title-row">
                      <div className="flex column">
                        <div>
                          <h2><Link to={`/nodes/${vsn}`}>{vsn}</Link></h2>
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

        </Card>
      </Content>
    </Drawer>
  )
}


const JobMetaBody = styled('div')`
  tbody td:first-child {
    width: 120px;
    text-align: right;
    vertical-align: top;
  }

  td > pre {
    margin: 0;
  }
`

const DrawerHeader = styled('div')`
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: ${({ theme }) => theme.palette.background.paper};
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  margin-bottom: 16px;
`

const Content = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0 16px 16px;

  .timeline-title {
    margin-top: 1rem;
  }
`

const SectionHeader = styled('div')`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: -16px -16px 1.25rem -16px;
  padding: 0.85rem 1.25rem;
  background: ${({ theme }) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#f8f9fa'};
  border-bottom: 2px solid ${({ theme }) => theme.palette.primary.main};
  border-radius: 4px 4px 0 0;
`

const HeaderDivider = styled('div')`
  width: 1px;
  height: 1.4em;
  background: ${({ theme }) => theme.palette.divider};
  flex-shrink: 0;
`

const SectionTitle = styled('h2')`
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1em;
  color: ${({ theme }) => theme.palette.mode === 'dark' ? '#fff' : '#333'};

  svg {
    color: ${({ theme }) => theme.palette.primary.main};
  }
`
