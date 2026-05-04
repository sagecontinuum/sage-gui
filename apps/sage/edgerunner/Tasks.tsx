import { useState } from 'react'

import { styled } from '@mui/material/styles'
import { Card } from '/components/layout/Layout'
import { type Task } from './EdgeRunner'
import { IconButton, Popover, Tooltip } from '@mui/material'

import {
  PauseCircleOutlineRounded, PlayCircleOutlineRounded,
  InfoOutlined}  from '@mui/icons-material'

import * as ES from '/components/apis/ses'

import { useSnackbar } from 'notistack'
import { useProgress } from '/components/progress/ProgressProvider'

import { Highlight, themes } from 'prism-react-renderer'
import { VSN } from '/components/apis/beekeeper'
import { modelOptions } from './models'

type Props = {
  value: Task[]
  onChange: (tasks: Task[]) => void
  onEditNode: (node: VSN) => void
}

const getArgValue = (args?: string[], key = '--model'): string => {
  if (!Array.isArray(args) || !args.length) {
    return ''
  }

  const idx = args.indexOf(key)
  if (idx >= 0 && idx + 1 < args.length) {
    const value = args[idx + 1]
    if (value && !value.startsWith('--')) {
      return value
    }
  }

  const inline = args.find((arg) => arg.startsWith(`${key}=`))
  if (inline) {
    return inline.slice(`${key}=`.length)
  }

  return ''
}

const getTaskModelLabel = (task: Task): string => {
  const plugin = task.fullJobSpec?.plugins?.[0]
  const args = plugin?.plugin_spec?.args || []
  const selectedModel = getArgValue(args, '--model')

  if (!selectedModel) {
    return 'unknown model'
  }

  return modelOptions.find((option) => option.value == selectedModel)?.label || selectedModel
}

export default function Tasks(props: Props) {
  const {value: tasks, onChange} = props

  const {enqueueSnackbar} = useSnackbar()
  const {loading, setLoading} = useProgress()

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  // const [selectorEl, setSelectorEl] = useState<HTMLButtonElement | null>(null)


  const handleChange = async (action: 'run' | 'remove' | 'suspend', task: Task) => {
    const {job_id} = task

    if (action == 'run') {
      await handleRunJob(job_id)
      return tasks
    } else if (action == 'suspend') {
      await handleSuspendJob(job_id)
      return tasks
    } else if (action == 'remove') {
      await handleRemoveJob(task.job_id)
      onChange(tasks.filter(obj => obj.job_id != job_id))
    } else {
      throw `action "${action}" not implemented`
    }
  }


  const handleRunJob = (id: string) => {
    setLoading(true)

    return ES.resubmitJobs(id)
      .then(() => {
        enqueueSnackbar(`Prompt restarted`, {variant: 'success'})
      })
      .catch((err) => {
        enqueueSnackbar(
          <>Failed to resubmit at least one prompt<br/>{err.message}</>,
          {variant: 'error', autoHideDuration: 7000}
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const handleSuspendJob = (id: string) => {
    setLoading(true)
    return ES.suspendJob(id)
      .then(() => {
        enqueueSnackbar(`One prompt suspended`, {variant: 'success'})
      })
      .catch((err) => {
        enqueueSnackbar(
          <>Failed to suspend prompt<br/>{err.message}</>,
          {variant: 'error', autoHideDuration: 5000}
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const handleRemoveJob = (id: string) => {
    setLoading(true)
    return ES.removeJob(id)
      .then(() => {
        enqueueSnackbar(`One prompt removed`, {variant: 'success'})
      })
      .catch((err) => {
        enqueueSnackbar(
          <>Failed to remove prompt<br/>{err.message}</>,
          {variant: 'error', autoHideDuration: 7000}
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const handleOpenDetails = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  // const handleEditNode = (vsn: VSN) => {
  //   onEditNode(vsn)
  // }

  /* todo(nc): advanced node selector
  const handleOpenNodeSelector = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSelectorEl(event.currentTarget)
  }

  const handleCloseNodeSelector = () => {
    setSelectorEl(null)
  }
  */

  const open = Boolean(anchorEl)
  const id = open ? 'task-meta-info-popover' : undefined


  // const openNodeSelector = Boolean(selectorEl)
  // const nodeSelectorId = openNodeSelector ? 'node-selector-popover' : undefined

  return (
    <TaskList className="list-none no-padding">
      {tasks.map(task => {
        const {fullJobSpec} = task
        if (!fullJobSpec) {
          return null
        }

        const node = Object.keys(fullJobSpec.nodes) // todo(nc): support multiple
        const modelLabel = getTaskModelLabel(task)

        return (
          <li key={task.job_id}>
            <Card style={{paddingBottom: 5}}>
              <div className="flex justify-between items-start">
                <div style={{flex: 1}}>
                  <div>{task.prompt || 'No prompt specified'}</div>
                  <div className="text-xs muted">Model: {modelLabel}</div>
                  <div className="text-xs muted">Node: {node}</div>
                </div>

                <Tooltip title="Show task details..." placement="right">
                  <IconButton onClick={handleOpenDetails}
                    size="small"
                    className="info-btn"
                  >
                    <InfoOutlined fontSize="small" sx={{cursor: 'pointer'}}/>
                  </IconButton>
                </Tooltip>
              </div>
              <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                sx={{height: '75%'}}
              >
                <Highlight theme={themes.dracula}
                  language="json"
                  code={JSON.stringify(fullJobSpec, null, 2)}
                >
                  {({ className, style, tokens, getLineProps, getTokenProps }) => (
                    <pre className={className} style={{...style, fontSize: '.85em'}}>
                      {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line, key: i })}>
                          {line.map((token, key) => (
                            <span key={key} {...getTokenProps({ token, key })} />
                          ))}
                        </div>
                      ))}
                    </pre>
                  )}
                </Highlight>
              </Popover>
              <br/>
              <div className="flex justify-between items-center">
                <div className={task.state.toLowerCase()}>
                  {task.state}
                </div>
                {/*
                  <Divider orientation="vertical" flexItem sx={{ margin: '5px 0' }} />

                  <div className="flex items-center">
                    <a href={`/nodes/${node}`} target="_blank" rel="noreferrer">
                      {node}
                    </a>
                    <IconButton
                      onClick={handleOpenNodeSelector}

                    >
                      <EditRounded fontSize="small"/>
                    </IconButton>
                  </div>
                </div>

                <Popover
                  id={nodeSelectorId}
                  open={openNodeSelector}
                  anchorEl={selectorEl}
                  onClose={handleCloseNodeSelector}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                  sx={{height: '75%', width: '1200px'}}
                >
                  <NodeSelectorContainer>
                    <NodeSelector selected={[]} onSelected={() => }} project="SGT" />
                    <DisabledOverlay>
                      <span className="overlay-message">
                        <b>Selecting nodes other than H00F is currently disabled.</b><br/>
                        Please <a href={config.contactUs} target="_blank" rel="noreferrer">contact us</a> if you are
                        interested in allowing edge-runner on your node.
                      </span>
                    </DisabledOverlay>
                  </NodeSelectorContainer>
                </Popover>
                */}

                <div>
                  {task.state != 'Running' &&
                    <Tooltip title={`Re-run Prompt`}>
                      <IconButton
                        onClick={() => handleChange('run', task)}
                        size="small"
                        disabled={loading}
                      >
                        <PlayCircleOutlineRounded />
                      </IconButton>
                    </Tooltip>
                  }

                  {task.state != 'Suspended' &&
                    <Tooltip title="Suspend">
                      <IconButton
                        onClick={() => handleChange('suspend', task)}
                        size="small"
                        disabled={loading}
                      >
                        <PauseCircleOutlineRounded />
                      </IconButton>
                    </Tooltip>
                  }
                  {/*
                  <Tooltip title="Remove">
                    <IconButton
                      onClick={() => handleChange('remove', task)}
                      className="danger"
                      size="small"
                      disabled={loading}
                    >
                      <DeleteOutlineRounded />
                    </IconButton>
                  </Tooltip>*/}
                </div>

              </div>
            </Card>
          </li>
        )
      })}
    </TaskList>
  )
}

const TaskList = styled('ul')`
  li {
    margin: 0 0 10px 0;
    position: relative;
  }

  .info-btn {
    margin-top: -10px;
    margin-right: -10px;
  }

  // todo: hover animations, etc
  .btn-controls {
    visibility: hidden;
  }

  &:hover .btn-controls {
    visibility: visible;
  }
`

/* todo(nc): advanced node selector
const NodeSelectorContainer = styled('div')`
  position: relative;
  margin: 20px;
  width: 1200px;
`

const DisabledOverlay = styled(Typography)`
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px;
  font-size: 1.2rem;
  color: #444;
  backdrop-filter: blur(2px);
  border-radius: 4px;
  height: 100%;

  .overlay-message {
    max-width: 62ch;
    line-height: 1.45;
    white-space: normal;
  }

  .overlay-message a {
    display: inline;
    margin: 0 0.25ch;
  }
`
*/
