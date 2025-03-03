import { useState, useEffect } from 'react'
import styled from 'styled-components'
import Sidebar from './Sidebar'

import Prompt from './Prompt'

import ErrorMsg from '../ErrorMsg'
import getDefaultSpec from './default-job'
import * as SES from '/components/apis/ses'
import * as LS from '/components/apis/localStorage'
import DefaultPrompts from './DefaultPrompts'
import Tasks from './Tasks'
import { useSnackbar } from 'notistack'

import { useProgress } from '/components/progress/ProgressProvider'


const storageKey = 'sage-assistant'



export type Task = {
  job_id: string
  job_name: string
  state: string
  prompt: string
  fullJobSpec: SES.Job
}

const getTasks = () : Task[] =>
  JSON.parse(LS.get(storageKey))



export default function Assistant() {
  const {enqueueSnackbar} = useSnackbar()

  const [prompt, setPrompt] = useState<string>('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const [jobState, setJobState] = useState<SES.Job>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const {loading, setLoading} = useProgress()

  useEffect(() => {
    let done = false
    let handle

    // get latest metrics
    function ping() {
      handle = setTimeout(async () => {
        if (done) return

        // recursive
        updateJobState()
      }, 5000)
    }

    const updateJobState = async () => {
      const tasks = getTasks() || []
      const id = tasks.length ? tasks[0].job_id : null

      if (!id) {
        return
      }

      let job
      try {
        setLoading(true)
        job = await SES.getJobStatus(id)
      } catch {
        console.log('err', job)
        setError(job)
      }

      setLastUpdate(new Date())
      setLoading(false)

      const oldRecord = tasks.filter(obj => obj.job_id != job.job_id)
      const newRecord: Task = {
        job_id: job.job_id,
        job_name: job.name,
        prompt: job.plugins[0]?.plugin_spec?.args.pop(), // assume last argument is prompt
        state: job.state.last_state,
        fullJobSpec: job
      }
      const records = [...oldRecord, newRecord]

      // LS.set(storageKey, records)
      setTasks(records)

      ping()
    }

    updateJobState()

    return () => {
      done = true
      clearTimeout(handle)
    }
  }, [])



  const handleSubmit = () => {
    setSubmitting(true)

    const tasks = getTasks() || null

    // consider single task for now
    const id = tasks ? tasks[0].job_id : null

    // if job exists, restart it
    if (id) {
      SES.editJob(id, getDefaultSpec(prompt, 'W027'))
        .then((res) => {
          const oldRecords = getTasks() || []
          const newRecord = {...res, prompt}
          const records = [...oldRecords, newRecord]
          LS.set(storageKey, records)
          setTasks(records)

          enqueueSnackbar(`Job resubmitted`, {variant: 'success'})
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
    } else {
      // otherwise, start a new one
      SES.submitJob(getDefaultSpec(prompt, 'W027'))
        .then((res) => {
          const oldRecords = getTasks() || []
          const newRecord = {...res, prompt}
          const records = [...oldRecords, newRecord]
          LS.set(storageKey, records)
          setTasks(records)
        })
        .catch(err => setError(err))
        .finally(() => setSubmitting(false))
    }

  }


  const handleDefaultPrompt = (val: string) => {
    setPrompt(val)
  }

  const handleTaskChange = (tasks) => {
    LS.set(storageKey, tasks)
    setTasks(tasks)
  }

  return (
    <Root className="flex">
      <Sidebar>
        <h3 className="flex justify-between items-end">
          Tasks
          <small>{lastUpdate?.toLocaleTimeString('en-US')}</small>
        </h3>
        <Tasks
          value={tasks}
          onChange={handleTaskChange}
        />
      </Sidebar>
      <Main className="flex column items-center">
        <div>
          Sage Assistant
          {error && <ErrorMsg>{error.message}</ErrorMsg>}
        </div>

        <PromptContainer className="flex items-center justify-center">
          <div className="flex column">
            <DefaultPrompts
              onClick={handleDefaultPrompt}
            />
            <Prompt
              value={prompt}
              onChange={(val) => setPrompt(val) }
              onSubmit={handleSubmit}
              loading={submitting}
            />
          </div>
        </PromptContainer>
      </Main>
    </Root>
  )
}


const Root = styled.div`
  height: 100%;
`

const Main = styled.div`
  padding: 20px;
  width: 100%;
`

const PromptContainer = styled.div`
  position: absolute;
  bottom: 0;
  width: 100%;
`


