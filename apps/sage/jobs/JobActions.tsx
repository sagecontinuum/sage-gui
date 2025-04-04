import { useState } from 'react'
import styled from 'styled-components'


import { Link } from 'react-router-dom'
import { Button, Divider, IconButton, Tooltip } from '@mui/material'

import EditIcon from '@mui/icons-material/EditRounded'
import DownloadIcon from '@mui/icons-material/CloudDownloadOutlined'
import PlayIcon from '@mui/icons-material/PlayCircleOutlineRounded'
import PauseIcon from '@mui/icons-material/PauseCircleOutlineRounded'
import RemoveIcon from '@mui/icons-material/DeleteOutlineRounded'

import ConfirmationDialog from '/components/dialogs/ConfirmationDialog'
import * as ES from '/components/apis/ses'
import { useProgress } from '/components/progress/ProgressProvider'
import { useSnackbar } from 'notistack'

import { type Views } from './JobStatus'

type Props = {
  view: Views
  jobs: ES.Job[]
  onDone: () => void
}

export default function JobActions(props: Props) {
  const {view, jobs = [], onDone} = props

  const {setLoading} = useProgress()
  const {enqueueSnackbar} = useSnackbar()

  const [confirmSuspend, setConfirmSuspend] = useState<boolean>(false)
  const [confirmRm, setConfirmRm] = useState<boolean>(false)


  const handleDownload = () => {
    ES.downloadTemplate(jobs[0].job_id)
  }

  const handleRunJob = () => {
    setLoading(true)
    const ids = jobs.map(o => o.job_id)
    return ES.reSubmitJobs(ids)
      .then(() => {
        const count = ids.length
        enqueueSnackbar(`${count} job${count > 1 ? 's' : ''} resubmitted`, {variant: 'success'})
      })
      .catch((err) => {
        enqueueSnackbar(
          <>Failed to resubmit at least one job<br/>{err.message}</>,
          {variant: 'error', autoHideDuration: 7000}
        )
      })
      .finally(() => {
        setLoading(false)
        onDone()
      })
  }

  const handleSuspendJob = () => {
    setLoading(true)
    return ES.suspendJobs(jobs.map(o => o.job_id))
      .then(resList => {
        const count = resList.filter(o => o.state == 'Suspended').length
        enqueueSnackbar(`${count} job${count > 1 ? 's' : ''} suspended`, {variant: 'success'})
      })
      .catch((err) => {
        enqueueSnackbar(
          <>Failed to suspend at least one job<br/>{err.message}</>,
          {variant: 'error', autoHideDuration: 7000}
        )
      })
      .finally(() => {
        setLoading(false)
        onDone()
      })
  }

  const handleRemoveJob = () => {
    setLoading(true)
    return ES.removeJobs(jobs.map(o => o.job_id))
      .then(resList => {
        const count = resList.filter(o => o.state == 'Removed').length
        enqueueSnackbar(`${count} job${count > 1 ? 's' : ''} removed`, {variant: 'success'})
      })
      .catch((err) => {
        enqueueSnackbar(
          <>Failed to remove at least one job<br/>{err.message}</>,
          {variant: 'error', autoHideDuration: 7000}
        )
      })
      .finally(() => {
        setLoading(false)
        onDone()
      })
  }


  return (
    <Root className="flex items-center">
      {jobs.length == 1 &&
        <>
          <Button
            component={Link}
            variant="contained"
            startIcon={<EditIcon/>}
            size="small"
            to={`/create-job?tab=editor&start_with_job=${jobs[0].job_id}`}>
            Recreate or edit job
          </Button>
          <Divider orientation="vertical" flexItem sx={{margin: '5px 10px'}}/>
        </>
      }

      {view == 'my-jobs' && jobs.length > 0 &&
        <>
          <Tooltip title={`Resubmit Job${jobs.length > 1 ? 's' : ''}`}>
            <IconButton
              onClick={handleRunJob}
              className="running"
            >
              <PlayIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={`Suspend Job${jobs.length > 1 ? 's' : ''}`}>
            <IconButton
              onClick={() => setConfirmSuspend(true)}
            >
              <PauseIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={`Remove Job${jobs.length > 1 ? 's' : ''}`}>
            <IconButton
              onClick={() => setConfirmRm(true)}
              className="danger"
            >
              <RemoveIcon />
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{margin: '5px 10px'}}/>
        </>
      }

      {jobs.length == 1 &&
        <Tooltip title="Download spec">
          <IconButton onClick={handleDownload}>
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      }


      {confirmRm &&
        <ConfirmationDialog
          title={`Are you sure you want to remove ${jobs.length > 1 ? 'these jobs' : 'this job'}?`}
          content={<p>
            Job{jobs.length > 1 ? 's' : ''} <b>
              {jobs.map(o => o.job_id).join(', ')}
            </b> will be removed!
          </p>}
          confirmBtnText="Remove"
          confirmBtnStyle={{background: '#c70000'}}
          onConfirm={handleRemoveJob}
          onClose={() => setConfirmRm(false)}
        />
      }

      {confirmSuspend &&
        <ConfirmationDialog
          title={`Are you sure you want to suspend ${jobs.length > 1 ? 'these jobs' : 'this job'}?`}
          content={<p>
            Job{jobs.length > 1 ? 's' : ''} <b>
              {jobs.map(o => o.job_id).join(', ')}
            </b> will be suspended!
          </p>}
          confirmBtnText="Suspend"
          confirmBtnStyle={{background: '#c70000'}}
          onConfirm={handleSuspendJob}
          onClose={() => setConfirmSuspend(false)}
        />
      }
    </Root>
  )
}

const Root = styled.div`

`
