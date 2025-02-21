import { useState } from 'react'
import styled from 'styled-components'
import Sidebar from './Sidebar'

import Prompt from './Prompt'

import ErrorMsg from '../ErrorMsg'
import getDefaultSpec from './default-job'
import * as SES from '/components/apis/ses'
import * as LS from '/components/apis/localStorage'
import DefaultPrompts from './DefaultPrompts'
import { Card } from '/components/layout/Layout'


const storageKey = 'sage-assistant'

const getTasks = () =>
  JSON.parse(LS.get(storageKey))


type Task = {
  job_id: string
  job_name: string
  state: string
  prompt: string
}


export default function Assistant() {

  const [prompt, setPrompt] = useState<string>('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const [tasks, setTasks] = useState<Task[]>(getTasks() || [])


  const handleSubmit = () => {
    setSubmitting(true)
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


  const handleDefaultPrompt = (val: string) => {
    setPrompt(val)
  }

  return (
    <Root className="flex">
      <Sidebar>
        <h3>Tasks</h3>
        <TaskList className="list-none no-padding">
          {tasks.map(task => {
            return (
              <li key={task.job_id}>
                <Card>
                  <div>
                    {task.prompt || 'No prompt specified'}
                    {JSON.stringify(task)}
                  </div>
                </Card>
              </li>
            )
          })}
        </TaskList>
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

const TaskList = styled.ul`
  li {
    margin: 0 0 10px 0;
  }
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


