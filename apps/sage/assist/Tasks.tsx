import { useState } from 'react'

import styled from 'styled-components'
import { Card } from '/components/layout/Layout'
import { type Task } from './Assistant'
import { Divider, IconButton, Popover, Tooltip } from '@mui/material'

import {
  PauseCircleOutlineRounded, DeleteOutlineRounded, PlayCircleOutlineRounded,
  InfoOutlined,
  EditRounded
}  from '@mui/icons-material'

import * as ES from '/components/apis/ses'

import { useSnackbar } from 'notistack'
import { useProgress } from '/components/progress/ProgressProvider'

import { Highlight, themes } from 'prism-react-renderer'
import { VSN } from '/components/apis/beekeeper'
import NodeSelector from '../jobs/create-job/NodeSelector'

type Props = {
  value: Task[]
  onChange: (tasks: Task[]) => void
  onEditNode: (node: VSN) => void
}

export default function Tasks(props: Props) {
  const {value: tasks, onChange} = props

  const {enqueueSnackbar} = useSnackbar()
  const {loading, setLoading} = useProgress()

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [selectorEl, setSelectorEl] = useState<HTMLButtonElement | null>(null)


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


  const handleOpenNodeSelector = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSelectorEl(event.currentTarget)
  }

  const handleCloseNodeSelector = () => {
    setSelectorEl(null)
  }

  const open = Boolean(anchorEl)
  const id = open ? 'task-meta-info-popover' : undefined


  const openNodeSelector = Boolean(selectorEl)
  const nodeSelectorId = openNodeSelector ? 'node-selector-popover' : undefined

  return (
    <TaskList className="list-none no-padding">
      {tasks.map(task => {
        const {fullJobSpec} = task

        const node = Object.keys(fullJobSpec.nodes) // todo(nc): support multiple

        return (
          <li key={task.job_id}>
            <Card style={{paddingBottom: 5}}>
              <div className="flex justify-between items-center">
                <div>{task.prompt || 'No prompt specified'}</div>

                <Tooltip title="Show task details..." placement="right">
                  <IconButton onClick={handleOpenDetails} size="small" className="info-btn">
                    <InfoOutlined fontSize="small" sx={{cursor: 'pointer'}}/>
                  </IconButton>
                </Tooltip>
                <div className="flex column gap-2">
                  <div>
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
                  </div>
                </div>
              </div>
              <br/>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap">
                  <div className={task.state.toLowerCase()}>
                    {task.state}
                  </div>

                  <Divider orientation="vertical" flexItem style={{margin: '5px' }} />

                  <div className="flex items-center">

                    <a href={`/node/${node}`} target="_blank" rel="noreferrer">
                      {node}
                    </a>
                    <IconButton
                      onClick={handleOpenNodeSelector}
                      size="small"
                    >
                      <EditRounded />
                    </IconButton>

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

                        <NodeSelector selected={[]} onSelected={() => { /* do nothing */ }} />
                      </NodeSelectorContainer>
                    </Popover>
                  </div>

                </div>

                <Divider orientation="vertical" flexItem style={{margin: '5px' }} />

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
                  <Tooltip title="Remove">
                    <IconButton
                      onClick={() => handleChange('remove', task)}
                      className="danger"
                      size="small"
                      disabled={loading}
                    >
                      <DeleteOutlineRounded />
                    </IconButton>
                  </Tooltip>
                </div>

              </div>
            </Card>
          </li>
        )
      })}
    </TaskList>
  )
}

const TaskList = styled.ul`
  li {
    margin: 0 0 10px 0;
    position: relative;
  }

  .info-btn {
    position: absolute;
    right: 5px;
    top: 5px;
  }

  // todo: hover animations, etc
  .btn-controls {
    visibility: hidden;
  }

  &:hover .btn-controls {
    visibility: visible;
  }
`

const NodeSelectorContainer = styled.div`
  margin: 20px;
  width: 1200px;
`
