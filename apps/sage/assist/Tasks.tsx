import styled from 'styled-components'
import { Card } from '/components/layout/Layout'
import { type Task } from './Assistant'
import { IconButton, Tooltip } from '@mui/material'

import {
  PauseCircleOutlineRounded, DeleteOutlineRounded, PlayCircleOutlineRounded,
  InfoOutlined
}  from '@mui/icons-material'

import * as YAML from 'yaml'
import * as ES from '/components/apis/ses'

import { useSnackbar } from 'notistack'
import { useProgress } from '/components/progress/ProgressProvider'


type Props = {
  value: Task[]
  onChange: (tasks: Task[]) => void
}

export default function Tasks(props: Props) {
  const {value: tasks, onChange} = props

  const {enqueueSnackbar} = useSnackbar()
  const {loading, setLoading} = useProgress()

  const handleChange = async (action: 'run' | 'remove' | 'suspend', task: Task) => {
    const {job_id, fullJobSpec} = task


    if (action == 'run') {
      await handleRunJob(job_id, YAML.stringify(fullJobSpec))
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


  const handleRunJob = (id: string, jobSpec: string) => {
    setLoading(true)

    return ES.editJob(id, jobSpec)
      .then(() => {
        ES.submitJob(jobSpec)
          .then(() => {
            enqueueSnackbar(`Job resubmitted`, {variant: 'success'})
          })
      })
      .catch((err) => {
        enqueueSnackbar(
          <>Failed to resubmit at least one job<br/>{err.message}</>,
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
        enqueueSnackbar(`One job suspended`, {variant: 'success'})
      })
      .catch((err) => {
        enqueueSnackbar(
          <>Failed to suspend at least one job<br/>{err.message}</>,
          {variant: 'error', autoHideDuration: 7000}
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
        enqueueSnackbar(`One job removed`, {variant: 'success'})
      })
      .catch((err) => {
        enqueueSnackbar(
          <>Failed to remove at least one job<br/>{err.message}</>,
          {variant: 'error', autoHideDuration: 7000}
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }


  return (
    <TaskList className="list-none no-padding">
      {tasks.map(task => {
        return (
          <li key={task.job_id}>
            <Card style={{paddingBottom: 5}}>
              <div className="flex justify-between items-center">
                {task.prompt || 'No prompt specified'}

                <Tooltip title={JSON.stringify(task)} placement="right">
                  <InfoOutlined fontSize="small"/>
                </Tooltip>
              </div>
              <br/>
              <div className="flex justify-between items-center">
                <div className={task.state.toLowerCase()}>
                  {task.state}
                </div>
                <div>
                  <Tooltip title={`Re-run Prompt`}>
                    <IconButton
                      onClick={() => handleChange('run', task)}
                      className="running"
                      size="small"
                      disabled={loading}
                    >
                      <PlayCircleOutlineRounded />
                    </IconButton>
                  </Tooltip>

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
  }
`