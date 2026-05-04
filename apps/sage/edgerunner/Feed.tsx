
import { useEffect, useState, memo, useRef, useMemo, type ReactNode, type SyntheticEvent } from 'react'
import { styled, alpha } from '@mui/material/styles'

import { type Task } from './EdgeRunner'
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Paper, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ObjectRenderer from './ObjectRenderer'
import TypingMarkdown from './TypingMarkdown'
import { useLogger } from './EdgeRunnerLogger'

import Bee from 'url:./bee.gif'
import { sortResponses } from './sgUtils'
import { relativeTime } from '/components/utils/units'
import { useProgress } from '/components/progress/ProgressProvider'

import { type ParsedRecord, type SchedulerStatus, getFeedSource, setupEventSource } from './edgerunner-api'
import {
  loadFeedHistory,
  setupSchedulerStatus,
  getNextRunTime,
  toDateFromTimestamp
} from './edgerunner-api'

const PROMPT_OVERLAY_HEIGHT = 300
const PROMPT_BOTTOM_OFFSET = 0
const PROMPT_CONTAINER_HEIGHT = 220
const RESPONSE_TYPING_INTERVAL_MS = 30
const RESPONSE_TYPING_FADE_MS = 180

type ResponseProps = {
  record: ParsedRecord
  showImage?: boolean
  enableTyping?: boolean
  timestampTick?: number
}

const getStreamPrompt = (record: ParsedRecord): string => {
  const valueObj = typeof record.value == 'object' && record.value ? record.value as {[key: string]: unknown} : {}
  const metaObj = record.meta as {[key: string]: unknown} | undefined
  const recordObj = record as unknown as {[key: string]: unknown}

  const promptCandidate =
    valueObj.query ||
    valueObj.prompt ||
    valueObj.question ||
    valueObj.input ||
    metaObj?.query ||
    metaObj?.prompt ||
    recordObj.query ||
    recordObj.prompt

  return typeof promptCandidate == 'string' ? promptCandidate : ''
}

const getTimeUntil = (nextRunTime: Date): string => {
  const diffMs = nextRunTime.getTime() - Date.now()

  if (diffMs <= 0) {
    return 'waiting...'
  }

  const totalSeconds = Math.ceil(diffMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours && minutes) {
    return `in ${hours}h ${minutes}m ${seconds}s`
  }

  if (hours) {
    return `in ${hours}h ${minutes}m ${seconds}s`
  }

  if (minutes) {
    return `in ${minutes}m ${seconds}s`
  }

  return `in ${seconds}s`
}

const getRecordKey = (record: ParsedRecord, index: number): string => {
  const meta = record.meta as {vsn?: string, node?: string, task?: string} | undefined
  const timestamp = String(record.timestamp || '')
  const vsn = meta?.vsn || meta?.node || 'unknown'
  const task = meta?.task || 'task'

  return `${vsn}-${task}-${timestamp}-${index}`
}

const Response = memo(function Response(props: ResponseProps) {
  const {record, showImage} = props
  const {value} = record
  const enableTyping = !!props.enableTyping
  const timestampTick = props.timestampTick || 0

  const [expanded, setExpanded] = useState<boolean>(!!showImage)

  const handleChange = (_: SyntheticEvent, open: boolean) => {
    setExpanded(open)
  }


  let ele: ReactNode = 'loading...'
  if (typeof value == 'object' && value) {
    const markdownOutput = (value as {output?: string}).output || ''
    const responsePrompt = getStreamPrompt(record)

    ele = <div>
      {responsePrompt &&
        <PromptBubble>
          {responsePrompt}
        </PromptBubble>
      }
      <TypingMarkdown
        markdownOutput={markdownOutput}
        enableTyping={enableTyping}
        typingIntervalMs={RESPONSE_TYPING_INTERVAL_MS}
        fadeInDurationMs={RESPONSE_TYPING_FADE_MS}
      />
      <span className="muted text-xs">{relativeTime(record.timestamp)}{timestampTick < 0 ? '' : ''}</span>
    </div>
  } else if (typeof value == 'string' && value.includes('https://')) {
    ele =
      <Accordion expanded={expanded} onChange={handleChange} className="upload">
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1-content"
          id="panel1-header"
        >
          <Typography component="span">Image</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {expanded && <ObjectRenderer url={value} retry={true} />}
        </AccordionDetails>
      </Accordion>
  } else {
    ele = value
  }

  return (
    <div>
      {ele}
    </div>
  )
}, (prev, next) => {
  return prev.record === next.record &&
    prev.showImage == next.showImage &&
    prev.enableTyping == next.enableTyping &&
    prev.timestampTick == next.timestampTick
})


type Props = {
  tasks: Task[]
  isRunning: boolean
  pendingPrompt?: string
  onClearPending?: () => void
}

export default memo(function Feed(props: Props) {
  const {tasks, isRunning, pendingPrompt, onClearPending} = props
  const currentTaskPrompt = pendingPrompt || tasks[0]?.prompt

  const bottomRef = useRef<HTMLDivElement | null>(null)
  const historyCountRef = useRef<number>(-1)

  const {setLoading} = useProgress()
  const { log } = useLogger()
  const [data, setData] = useState<ParsedRecord[]>()
  const [feedError, setFeedError] = useState<string | null>(null)
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null)
  const [nextRunTime, setNextRunTime] = useState<Date | null>(null)
  const [statusTick, setStatusTick] = useState(0)
  const [responseTimestampTick, setResponseTimestampTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setStatusTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setResponseTimestampTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Memoize feed source to avoid recalculating
  const feedSource = useMemo(() => getFeedSource(tasks[0]), [tasks])
  const displayNextRunTime = useMemo(() => {
    if (!isRunning) return null
    const schedulerNextRun = toDateFromTimestamp(schedulerStatus?.nextRun)
    return schedulerNextRun || nextRunTime
  }, [isRunning, schedulerStatus?.nextRun, nextRunTime])
  const latestResponseIndex = useMemo(
    () => (data?.length ? data.length - 1 : -1),
    [data?.length]
  )

  // Calculate next run time from schedule rule
  useEffect(() => {
    const scienceRules = tasks[0]?.fullJobSpec?.science_rules || []
    let cronExpr: string | null = null

    // Extract cron expression from scienceRules
    for (const rule of scienceRules) {
      const match = rule.match(/cronjob\("[^"]*",\s*"([^"]+)"\)/)
      if (match?.[1]) {
        cronExpr = match[1]
        break
      }
    }

    if (cronExpr) {
      const nextRun = getNextRunTime(cronExpr)
      setNextRunTime(nextRun)
    }
  }, [tasks, statusTick])

  // get history of data
  useEffect(() => {
    if (!feedSource) {
      setFeedError(null)
      return
    }


    // Load previous data
    const fetchHistory = async () => {
      setLoading(true)
      setFeedError(null)
      log('request', 'loadFeedHistory', feedSource)

      try {
        const data = await loadFeedHistory(feedSource)
        historyCountRef.current = data.length
        log('completion', `loadFeedHistory — ${data.length} records`)
        setData(data)
      } catch (err) {
        console.error('Failed to fetch feed history', err)
        log('error', 'loadFeedHistory failed', (err as Error)?.message)
        setFeedError('Unable to load previous responses. Live updates may still continue.')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [setLoading, feedSource, log])

  // once we have historical data, start eventSource streaming with reconnect
  useEffect(() => {
    if (!feedSource) return

    setFeedError(null)

    let currentSource: ReturnType<typeof setupEventSource> = null
    let retryHandle: ReturnType<typeof setTimeout> | undefined
    let destroyed = false
    let retryDelay = 3000

    const connect = () => {
      currentSource = setupEventSource(feedSource, {
        onMessage: (obj) => {
          retryDelay = 3000 // reset backoff on success
          setFeedError(null)
          log('completion', 'stream message', obj)
          setData(prev => [...(prev || []), obj].sort(sortResponses))
          onClearPending?.()
        },
        onError: () => {
          if (destroyed) return
          log('error', 'stream disconnected')
          setFeedError('Live feed disconnected. Reconnecting...')
          currentSource?.close()
          retryHandle = setTimeout(() => {
            if (!destroyed) connect()
          }, retryDelay)
          retryDelay = Math.min(retryDelay * 2, 30000) // exponential backoff, max 30s
        }
      })
    }

    connect()

    return () => {
      destroyed = true
      clearTimeout(retryHandle)
      currentSource?.close()
    }
  }, [feedSource, log, onClearPending])

  // Watch scheduler status for task execution
  useEffect(() => {
    const vsn = feedSource?.vsns?.[0]
    const task = feedSource?.task
    if (!vsn || !task) return

    const statusSource = setupSchedulerStatus(vsn, task, {
      onStatus: (status) => {
        log('info', `scheduler status: ${status.status}`, status)
        setSchedulerStatus(status)
      },
      onError: () => {
        log('error', 'scheduler status stream failed')
        console.error('Failed to watch scheduler status')
      }
    })

    return () => {
      statusSource?.close()
    }
  }, [feedSource, log])

  useEffect(() => {
    if (!bottomRef.current) return
    const raf = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({block: 'end'})
    })
    return () => cancelAnimationFrame(raf)
  }, [data, isRunning])

  return (
    <Root id="responses">
      {feedError && <StickyErrorMsg role="alert">{feedError}</StickyErrorMsg>}
      {data?.map((record, i) => {
        return (
          <div key={getRecordKey(record, i)} className="response">
            <Response
              record={record}
              showImage={i > data.length - 5 * 2}
              enableTyping={i == latestResponseIndex && i >= historyCountRef.current}
              timestampTick={responseTimestampTick}
            />
          </div>
        )
      })
      }
      {displayNextRunTime && (
        <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 1.25, mb: 1.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {schedulerStatus &&
            <>
              <Typography variant="body2">Status:</Typography>
              <Chip
                size="small"
                variant="outlined"
                color={
                  schedulerStatus.status === 'running' ? 'success'
                    : schedulerStatus.status === 'scheduled' ? 'info' : 'default'
                }
                icon={<StatusDot status={schedulerStatus.status} />}
                label={schedulerStatus.status.charAt(0).toUpperCase() + schedulerStatus.status.slice(1)}
              />
            </>
            }
          </Box>
          <Typography variant="body2">
            <strong>Next run:</strong> {displayNextRunTime.toLocaleTimeString()} ({getTimeUntil(displayNextRunTime)})
          </Typography>
        </Paper>
      )}
      {schedulerStatus?.status === 'running' &&
        <>
          {currentTaskPrompt &&
            <PromptBubble>{currentTaskPrompt}</PromptBubble>
          }
          <LoadingBee className="flex column items-center justify-center">
            <img src={Bee} />
            <LightSweepText text="I'm working on a response..." />
          </LoadingBee>
        </>
      }
      <BottomSpacer ref={bottomRef} />
      <FeedOccluder />
    </Root>
  )
}, (prev, next) =>
  JSON.stringify(prev.tasks) == JSON.stringify(next.tasks) &&
  prev.isRunning == next.isRunning &&
  prev.pendingPrompt == next.pendingPrompt &&
  prev.onClearPending == next.onClearPending)


const Root = styled('div')`
  width: 100%;
  max-width: 960px;
  padding: 40px;
  padding-bottom: 24px;

  position: relative;

  .response {
    margin-bottom: 30px;

    img {
      max-width: 800px;
    }
  }

  .response .upload {
    margin-bottom: 40px;
  }
`

const FeedOccluder = styled('div')(({ theme }) => ({
  position: 'sticky',
  bottom: PROMPT_BOTTOM_OFFSET,
  zIndex: 3,
  pointerEvents: 'none',
  height: PROMPT_OVERLAY_HEIGHT,
  marginTop: -PROMPT_OVERLAY_HEIGHT,
  background: `linear-gradient(
    180deg,
    ${alpha(theme.palette.background.default, 0)} 0%,
    ${alpha(theme.palette.background.default, 0.2)} 30%,
    ${alpha(theme.palette.background.default, 0.75)} 68%,
    ${theme.palette.background.default} 100%
  )`,
}))

const StickyErrorMsg = styled('div')`
  position: sticky;
  top: 0;
  z-index: 6;
  margin-bottom: 10px;
  background: #fce8e6;
  color: #8a1c1c;
  border: 1px solid #f2b8b5;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 0.85rem;
  font-weight: 600;
`


const StatusDot = styled('div')<{status: string}>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(props) => {
    switch (props.status) {
      case 'running':
        return '#338135'
      case 'scheduled':
        return '#2196f3'
      default:
        return '#9e9e9e'
    }
  }};
  animation: ${(props) => props.status === 'running' ? 'pulse 1.5s ease-in-out infinite' : 'none'};

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`


const BottomSpacer = styled('div')`
  height: ${PROMPT_CONTAINER_HEIGHT}px;
`

const PromptBubble = styled('div')`
  display: block;
  width: fit-content;
  max-width: 80%;
  margin-left: auto;
  background: #c6b9ff;
  padding: 5px 10px;
  margin: 2rem 0 .5rem auto;
  border-radius: 10px 0 10px 10px;
  font-weight: bold;
`

const WaveTextRoot = styled('span')`
  display: inline-block;

  span {
    display: inline-block;
    animation: wave 1.2s ease-in-out infinite;
  }

  @keyframes wave {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
`

const WaveText = ({ text }: { text: string }) => (
  <WaveTextRoot>
    {text.split('').map((char, i) => (
      <span key={i} style={{ animationDelay: `${i * 0.04}s` }}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ))}
  </WaveTextRoot>
)

export { WaveText }

const LightSweepTextRoot = styled('span')`
  display: inline-block;
  font-weight: 500;
  background: linear-gradient(
    90deg,
    #5f6368 0%,
    #5f6368 30%,
    #c0c8d8 48%,
    #ffffff 50%,
    #c0c8d8 52%,
    #5f6368 70%,
    #5f6368 100%
  );
  background-size: 200% auto;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  animation: lightsweep 2.4s linear infinite;

  @keyframes lightsweep {
    0% { background-position: 150% center; }
    100% { background-position: -50% center; }
  }
`

const LightSweepText = ({ text }: { text: string }) => (
  <LightSweepTextRoot>{text}</LightSweepTextRoot>
)

const LoadingBee = styled('div')`
  margin: .5rem 0 1.25rem;
  opacity: 1;

  span {
    color: #5f6368;
    font-weight: 500;
  }


  img {
    max-width: 72px;
  }
`