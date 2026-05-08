import { useState, useEffect, useCallback, useRef } from 'react'
import { styled } from '@mui/material/styles'
import Sidebar from '/components/layout/WideSidebar'
import { Select, MenuItem, Box, Button, Tooltip } from '@mui/material'
import { ListSubheader } from '/components/layout/Layout'

import Prompt from './Prompt'

import ErrorMsg from '../ErrorMsg'
import getDefaultSpec from './default-job'
import * as SES from '/components/apis/ses'
import * as LS from '/components/apis/localStorage'
import Auth from '/components/auth/auth'
import { type VSN } from '/components/apis/beekeeper'
import DefaultPrompts from './DefaultPrompts'
import Tasks from './Tasks'
import ModelSelector from './ModelSelector'
import CameraSelector, { getDefaultCameraValue, getCameraOptionsForNode } from './CameraSelector'
import ChatSelector from './ChatSelector'
import AssistLogger, { LoggerProvider, useLogger, type LogEntry } from './EdgeRunnerLogger'
import { useSnackbar } from 'notistack'
import { modelOptions, sageRecommendedModelOptions } from './models'
import { compactMenuItemSx, compactSelectSx } from './selectStyles'

import Feed from './Feed'
import { AddRounded } from '@mui/icons-material'



const storageKey = 'sage-edgerunner'



export type Task = {
  job_id: string
  job_name: string
  state: string
  prompt: string
  fullJobSpec: SES.Job
}

type PersistedAssistantState = {
  tasks: Task[]
  selectedNode?: string
}

const getPromptArg = (args?: string[]): string => {
  if (!Array.isArray(args) || !args.length) {
    return ''
  }

  const promptIndex = args.indexOf('--prompt')
  if (promptIndex >= 0 && promptIndex + 1 < args.length) {
    const promptValue = args[promptIndex + 1]
    if (promptValue && !promptValue.startsWith('--')) {
      return promptValue
    }
  }

  const inlinePrompt = args.find(arg => arg.startsWith('--prompt='))
  if (inlinePrompt) {
    return inlinePrompt.slice('--prompt='.length)
  }

  return ''
}

const getPersistedAssistantState = () : PersistedAssistantState => {
  const raw = LS.get(storageKey)
  if (!raw) return {tasks: []}

  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      // Backward compatibility with legacy format that stored only task arrays.
      return {tasks: parsed}
    }

    if (parsed && typeof parsed == 'object') {
      return {
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        selectedNode: typeof parsed.selectedNode == 'string' ? parsed.selectedNode : undefined
      }
    }

    return {tasks: []}
  } catch {
    return {tasks: []}
  }
}

const getTasks = () : Task[] => getPersistedAssistantState().tasks

const toError = (err: unknown): Error => {
  if (err instanceof Error) return err
  if (typeof err == 'string') return new Error(err)
  return new Error('Unknown error')
}

const getEveryCron = (mins: number): string => {
  if (mins <= 1) return '* * * * *'
  return `*/${mins} * * * *`
}

const getFrequencyLabel = (mins: number): string => {
  if (mins < 60) return `${mins}m`
  if (mins % 60 == 0) return `${mins / 60}h`
  return `${mins}m`
}

const nodeOptions = ['H00F', 'H015'] as const

const getStoredNode = (): string => {
  const savedNode = getPersistedAssistantState().selectedNode
  return savedNode && nodeOptions.includes(savedNode as typeof nodeOptions[number])
    ? savedNode
    : 'H00F'
}

const persistAssistantState = (tasks: Task[], selectedNode: string) => {
  LS.set(storageKey, {tasks, selectedNode})
}



export default function EdgeRunner() {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])
  const handleLogEntry = useCallback((entry: LogEntry) => setLogEntries(prev => [...prev, entry]), [])

  return (
    <LoggerProvider onEntry={handleLogEntry}>
      <AssistantInner
        logEntries={logEntries}
        onClearLogs={() => setLogEntries([])}
      />
    </LoggerProvider>
  )
}

type InnerProps = {
  logEntries: LogEntry[]
  onClearLogs: () => void
}

function AssistantInner({ logEntries, onClearLogs }: InnerProps) {
  const {enqueueSnackbar} = useSnackbar()
  const { log } = useLogger()

  const [prompt, setPrompt] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>(
    sageRecommendedModelOptions[0]?.value || modelOptions[0]?.value || 'gemma4:e2b'
  )
  const [selectedNode, setSelectedNode] = useState<string>(() => getStoredNode())
  const [selectedCamera, setSelectedCamera] = useState<string>(getDefaultCameraValue('H00F'))
  const [selectedFrequency, setSelectedFrequency] = useState<number>(1)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [pendingPrompt, setPendingPrompt] = useState<string>('')
  const handleClearPending = useCallback(() => setPendingPrompt(''), [])

  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const selectedNodeRef = useRef(selectedNode)
  const [chatSelectorOpenSignal, setChatSelectorOpenSignal] = useState(0)

  // const [showNodeSelector, setShowNodeSelector] = useState(false)


  const activeJobId = tasks[0]?.job_id
  const activeTaskOwner = tasks[0]?.fullJobSpec?.user
  const isViewingForeignChat = !!activeTaskOwner && activeTaskOwner !== Auth.user

  useEffect(() => {
    const nodeCameras = getCameraOptionsForNode(selectedNode)
    if (nodeCameras.some((camera) => camera.value == selectedCamera)) {
      return
    }

    setSelectedCamera(getDefaultCameraValue(selectedNode))
  }, [selectedNode, selectedCamera])

  useEffect(() => {
    selectedNodeRef.current = selectedNode
    const savedTasks = getTasks()
    persistAssistantState(savedTasks, selectedNode)
  }, [selectedNode])

  useEffect(() => {
    const restoreSavedChat = async () => {
      const savedTasks = getTasks()
      const savedJobId = savedTasks[0]?.job_id
      if (!savedJobId) return

      try {
        const job = await SES.getJobStatus(String(savedJobId))
        const restoredTask: Task = {
          job_id: String(job.job_id),
          job_name: job.name,
          prompt: getPromptArg(job.plugins[0]?.plugin_spec?.args),
          state: job.state.last_state,
          fullJobSpec: job
        }

        persistAssistantState([restoredTask], selectedNodeRef.current)
        setTasks([restoredTask])
        setLastUpdate(new Date())
      } catch (err) {
        console.log('restoreSavedChat err', err)
      }
    }

    restoreSavedChat()
  }, [])

  useEffect(() => {
    const id = activeJobId
    if (!id) return

    let done = false
    let handle: ReturnType<typeof setTimeout> | undefined

    const pollJobState = async () => {
      try {
        const job = await SES.getJobStatus(id)
        if (done) return

        setLastUpdate(new Date())

        const newRecord: Task = {
          job_id: String(job.job_id),
          job_name: job.name,
          prompt: getPromptArg(job.plugins[0]?.plugin_spec?.args),
          state: job.state.last_state,
          fullJobSpec: job
        }

        persistAssistantState([newRecord], selectedNodeRef.current)
        setTasks([newRecord])
      } catch (err) {
        if (done) return
        console.log('err', err)
        setError(toError(err))
      } finally {
        if (!done) {
          handle = setTimeout(pollJobState, 5000)
        }
      }
    }

    pollJobState()

    return () => {
      done = true
      if (handle) clearTimeout(handle)
    }
  }, [activeJobId])


  const handleSubmit = () => {
    const submittedPrompt = prompt
    setSubmitting(true)
    setPrompt('')
    setPendingPrompt(submittedPrompt)

    const tasks = getTasks() || []

    // consider single task for now
    const id = tasks.length ? tasks[0].job_id : null

    // if job exists, restart it
    if (id) {
      // preserve the existing task name / id
      const existingTaskName = tasks[0]?.fullJobSpec?.plugins?.[0]?.name || ''
      const existingId = existingTaskName.startsWith('edgerunner-demo-')
        ? existingTaskName.slice('edgerunner-demo-'.length)
        : ''
      const spec = getDefaultSpec({
        prompt: submittedPrompt,
        vsn: selectedNode,
        model: selectedModel,
        camera: selectedCamera,
        every: getEveryCron(selectedFrequency),
        id: existingId,
      })
      log('request', 'editJob', { id, model: selectedModel, camera: selectedCamera, prompt: submittedPrompt })
      SES.editJob(id, spec)
        .then((res) => {
          const oldRecords = getTasks() || []
          const newRecord = {...res, prompt: submittedPrompt}
          const records = [...oldRecords, newRecord]
          persistAssistantState(records, selectedNode)
          setTasks(records)

          // todo(nc): look into possible race condition
          SES.resubmitJobs(id)
            .then(() => {
              log('completion', 'resubmitJobs success', { id })
              enqueueSnackbar(`New prompt task started`, {variant: 'success'})
            })
            .catch((err) => {
              log('error', 'resubmitJobs failed', err?.message)
              enqueueSnackbar(
                <>Failed to resubmit at least one prompt<br/>{err.message}</>,
                {variant: 'error', autoHideDuration: 7000}
              )
            })
            .finally(() => {
              setSubmitting(false)
            })
        })
        .catch((err) => {
          log('error', 'editJob failed', err?.message)
          enqueueSnackbar(
            <>Failed to resubmit at least one job<br/>{err.message}</>,
            {variant: 'error', autoHideDuration: 7000}
          )
        })
        .finally(() => {
          // setLoading(false)
        })
    } else {
      // otherwise, start a new one
      const newId = crypto.randomUUID().slice(0, 8)
      const spec = getDefaultSpec({
        prompt: submittedPrompt,
        vsn: selectedNode,
        model: selectedModel,
        camera: selectedCamera,
        every: getEveryCron(selectedFrequency),
        id: newId,
      })
      log('request', 'submitJob', { model: selectedModel, camera: selectedCamera, prompt: submittedPrompt })
      SES.submitJob(spec)
        .then(async (res) => {
          log('completion', 'submitJob success', { job_id: res.job_id })
          const job = await SES.getJobStatus(String(res.job_id))
          const newRecord: Task = {
            job_id: String(job.job_id),
            job_name: job.name,
            prompt: getPromptArg(job.plugins[0]?.plugin_spec?.args) || submittedPrompt,
            state: job.state.last_state,
            fullJobSpec: job
          }
          persistAssistantState([newRecord], selectedNode)
          setTasks([newRecord])
        })
        .catch(err => {
          log('error', 'submitJob failed', err?.message || String(err))
          setError(toError(err))
        })
        .finally(() => setSubmitting(false))
    }

  }


  const handleDefaultPrompt = (val: string) => {
    setPrompt(val)
  }

  const handleTaskChange = (tasks: Task[]) => {
    persistAssistantState(tasks, selectedNode)
    setTasks(tasks)
  }

  const handleEditNode = (node: VSN) => {
    enqueueSnackbar(`Node changes are currently disabled (${node})`, {variant: 'info'})
  }

  const handleSelectChat = (job: SES.Job) => {
    persistAssistantState([], selectedNode)
    setTasks([])
    const task: Task = {
      job_id: String(job.job_id),
      job_name: job.name,
      prompt: getPromptArg(job.plugins?.[0]?.plugin_spec?.args),
      state: job.state?.last_state || '',
      fullJobSpec: job
    }
    persistAssistantState([task], selectedNode)
    setTasks([task])
  }

  const handleNewChat = () => {
    persistAssistantState([], selectedNode)
    setTasks([])
  }

  return (
    <Root className="flex">
      <Sidebar width={325}>
        <h3 className="flex justify-between items-end">
          Tasks
          <small>
            {lastUpdate?.toLocaleTimeString('en-US')}
          </small>
        </h3>
        <Tasks
          value={tasks}
          onChange={handleTaskChange}
          onEditNode={handleEditNode}
          // onEditNode={() => setShowNodeSelector((prev => !prev))}
        />

        <AssistLogger entries={logEntries} onClear={onClearLogs} />
      </Sidebar>

      <Main className="flex column items-center w-full" id="main">
        <Title>
          <div className="flex items-center">
            <h3>EdgeRunner</h3>
            <Tooltip title="New chat" placement="bottom">
              <Button onClick={handleNewChat} sx={{ mr: 2,  color: 'text.secondary' }}
                startIcon={<AddRounded fontSize="small" />}>
                New chat
              </Button>
            </Tooltip>
            <ChatSelector
              currentJobId={tasks[0]?.job_id}
              onSelect={handleSelectChat}
              onNew={handleNewChat}
              openSignal={chatSelectorOpenSignal}
            />
          </div>

          {error && <ErrorMsg>{error.message}</ErrorMsg>}
        </Title>

        <Feed key={tasks[0]?.job_id || 'none'} tasks={tasks}
          isRunning={!!tasks.find(task => task.state == 'Running')}
          pendingPrompt={pendingPrompt}
          onClearPending={handleClearPending}
        />

        {/* stick prompt box at bottom */}
        <PromptContainer >
          {isViewingForeignChat && (
            <InputLockOverlay>
              <strong>This chat belongs to {activeTaskOwner}.</strong>
              <span>You can view the history, but prompt input is disabled.</span>
              <div className="overlay-actions">
                <button type="button" onClick={() => setChatSelectorOpenSignal(prev => prev + 1)}>
                  Select a different chat
                </button>
                <button type="button" onClick={handleNewChat}>
                  Create a new chat
                </button>
              </div>
            </InputLockOverlay>
          )}
          <div className="flex column w-full">
            <DefaultPrompts
              onClick={handleDefaultPrompt}
            />
            <Prompt
              value={prompt}
              onChange={(val) => setPrompt(val) }
              onSubmit={handleSubmit}
              loading={submitting || isViewingForeignChat}
            />
            <ControlsRow className="flex justify-between">
              <div>
                <ModelSelector value={selectedModel} onChange={setSelectedModel} />
                <Select
                  value={selectedFrequency}
                  onChange={(e) => setSelectedFrequency(e.target.value as number)}
                  variant="standard"
                  disableUnderline
                  renderValue={(value) => `run every ${getFrequencyLabel(Number(value))}`}
                  sx={{
                    ...compactSelectSx,
                    minWidth: 100
                  }}
                >
                  <ListSubheader>run every...</ListSubheader>
                  <MenuItem value={1} sx={compactMenuItemSx}>1m</MenuItem>
                  <MenuItem value={5} sx={compactMenuItemSx}>5m</MenuItem>
                  <MenuItem value={10} sx={compactMenuItemSx}>10m</MenuItem>
                  <MenuItem value={15} sx={compactMenuItemSx}>15m</MenuItem>
                  <MenuItem value={30} sx={compactMenuItemSx}>30m</MenuItem>
                  <MenuItem value={60} sx={compactMenuItemSx}>1h</MenuItem>
                  <MenuItem value={120} sx={compactMenuItemSx}>2h</MenuItem>
                  <MenuItem value={240} sx={compactMenuItemSx}>4h</MenuItem>
                  <MenuItem value={480} sx={compactMenuItemSx}>8h</MenuItem>
                </Select>
              </div>
              <div>
                <Select
                  value={selectedNode}
                  onChange={(e) => setSelectedNode(e.target.value as string)}
                  variant="standard"
                  disableUnderline
                  renderValue={(value) => `node ${value}`}
                  sx={{
                    ...compactSelectSx,
                    minWidth: 92
                  }}
                >
                  <ListSubheader>node</ListSubheader>
                  {nodeOptions.map((node) => (
                    <MenuItem key={node} value={node} sx={compactMenuItemSx}>{node}</MenuItem>
                  ))}
                </Select>

                <CameraSelector node={selectedNode} value={selectedCamera} onChange={setSelectedCamera} />
              </div>
            </ControlsRow>
          </div>

        </PromptContainer>
      </Main>
    </Root>
  )
}


const Root = styled('div')`
  height: 100%;
`

const ControlsRow = styled(Box)`
  display: flex;
  gap: 1rem;
  margin-top: -0.4rem;
  margin-left: 1rem;
  margin-right: 2rem;
  padding: 0;

  .MuiInputBase-root {
    min-width: 20px;
  }
`

const boxShadow = `
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  box-shadow:
    0px 2px 4px -1px rgb(0 0 0 / 0%),
    0px 4px 5px 0px rgb(0 0 0 / 0%),
    0px 1px 10px 0px rgb(0 0 0 / 12%);
`

const Title = styled('div')`
  ${boxShadow}

  position: sticky;
  top: 0;
  z-index: 1;
  width: 100%;
  background: ${({ theme }) => theme.palette.background.paper};

  h3 {
    margin: .85rem 1rem;
  }
`

const Main = styled('div')`
  padding: 0 0;
  overflow-y: scroll;
  background: ${({ theme }) => theme.palette.background.default};
`

const PromptContainer = styled('div')`
  ${boxShadow}

  position: sticky;
  bottom: 20px;
  z-index: 5;

  background: ${({ theme }) => theme.palette.background.paper};

  padding: 20px;
  margin: 20px;
  border-radius: 10px;
`

const InputLockOverlay = styled('div')`
  position: absolute;
  inset: 0;
  z-index: 6;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.35rem;
  text-align: center;
  padding: 1.25rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(3px);

  .overlay-actions {
    margin-top: 0.4rem;
    display: flex;
    gap: 0.8rem;
  }

  button {
    border: none;
    background: transparent;
    color: ${({ theme }) => theme.palette.primary.main};
    text-decoration: underline;
    text-underline-offset: 2px;
    font-weight: 700;
    cursor: pointer;
    padding: 0;
  }
`


