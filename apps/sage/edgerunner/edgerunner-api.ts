import { type Task } from './EdgeRunner'
import * as BH from '/components/apis/beehive'
import { sortResponses } from './sgUtils'

export type ParsedRecord = BH.Record |
  (BH.Record & {
    value: {
      query?: string,
      answer?: unknown,
      output?: string
    }
  })

export type SchedulerStatus = {
  vsn: string
  timestamp: number
  status: 'idle' | 'running' | 'scheduled'
  nextRun?: number | string
}

export type FeedSource = {
  vsns: string[],
  task: string
} | null

type EventSourceHandlers = {
  onMessage: (record: ParsedRecord) => void
  onError: () => void
}

type SchedulerStatusHandlers = {
  onStatus: (status: SchedulerStatus) => void
  onError: () => void
}

const getSchedulerState = (eventName: unknown, value: Record<string, unknown>): SchedulerStatus['status'] => {
  const normalizedEventName = typeof eventName == 'string' ? eventName.toLowerCase() : ''
  const schedulerStatus = typeof value.plugin_status_by_scheduler == 'string'
    ? value.plugin_status_by_scheduler.toLowerCase()
    : ''
  const podStatus = typeof value.k3s_pod_status == 'string' ? value.k3s_pod_status.toLowerCase() : ''

  if (
    normalizedEventName.endsWith('.running') ||
    normalizedEventName.endsWith('.launched') ||
    schedulerStatus == 'running' ||
    podStatus == 'running'
  ) {
    return 'running'
  }

  if (
    normalizedEventName.endsWith('.queued') ||
    normalizedEventName.endsWith('.selected') ||
    normalizedEventName.endsWith('.scheduled') ||
    normalizedEventName.endsWith('.initializing') ||
    schedulerStatus == 'scheduled' ||
    schedulerStatus == 'queued' ||
    podStatus == 'pending'
  ) {
    return 'scheduled'
  }

  return 'idle'
}

/**
 * Extract feed source (VSNs and task name) from the first task's job spec.
 */
export const getFeedSource = (task: Task | undefined): FeedSource => {
  if (!task?.fullJobSpec) return null
  const {nodes, plugins} = task.fullJobSpec
  const vsns = Array.isArray(nodes)
    ? nodes.map(vsn => String(vsn))
    : Object.keys(nodes || {})
  const taskName = plugins[0]?.name

  console.log(task.fullJobSpec)

  return taskName && vsns.length ? {vsns, task: taskName} : null
}

/**
 * Safely parse JSON strings. Returns original value if parsing fails.
 */
export const parseJsonRecord = (record: unknown): unknown => {
  try {
    return JSON.parse(record as string)
  } catch {
    return record
  }
}

export const toDateFromTimestamp = (value: number | string | undefined): Date | null => {
  if (value == null) return null

  const numericValue = typeof value == 'string' ? Number(value) : value
  if (!Number.isFinite(numericValue)) return null

  let timestampMs = numericValue

  // Normalize unix timestamps that may arrive in seconds, microseconds, or nanoseconds.
  if (timestampMs < 1e12) {
    timestampMs *= 1000
  } else if (timestampMs > 1e15 && timestampMs < 1e18) {
    timestampMs = Math.floor(timestampMs / 1000)
  } else if (timestampMs >= 1e18) {
    timestampMs = Math.floor(timestampMs / 1e6)
  }

  return new Date(timestampMs)
}

/**
 * Set up event source streaming with configurable handlers.
 */
export const setupEventSource = (feedSource: FeedSource, handlers: EventSourceHandlers) => {
  if (!feedSource) return null

  const eventSource = BH.createEventSource({vsn: feedSource.vsns.join('|'), task: feedSource.task})

  eventSource.onerror = () => {
    console.error('Feed stream error')
    handlers.onError()
  }

  eventSource.onmessage = (e) => {
    let obj: unknown
    try {
      obj = JSON.parse(e.data)
    } catch (err) {
      console.error('Invalid feed message payload', err)
      handlers.onError()
      return
    }

    // Try to parse nested value
    if (typeof obj === 'object' && obj !== null && 'value' in obj) {
      (obj as Record<string, unknown>).value = parseJsonRecord((obj as Record<string, unknown>).value)
    }

    handlers.onMessage(obj as ParsedRecord)
  }

  return eventSource
}

/**
 * Load historical feed data from the past day.
 */
export const loadFeedHistory = async (feedSource: FeedSource): Promise<ParsedRecord[]> => {
  if (!feedSource) return []

  const res = await BH.getData({
    start: '-10d',
    filter: {
      vsn: feedSource.vsns.join('|'),
      task: feedSource.task
    }
  })

  let data = res.sort(sortResponses)

  data = data.map(obj => {
    if (typeof obj.value === 'string') {
      obj.value = parseJsonRecord(obj.value) as ParsedRecord['value']
    }
    return obj
  })

  return data
}

/**
 * Watch scheduler status for task execution.
 * Listens to sys.scheduler.status.plugin.* events.
 */
export const setupSchedulerStatus = (
  vsn: string,
  task: string,
  handlers: SchedulerStatusHandlers
) => {
  const eventSource = new EventSource(
    `https://data.sagecontinuum.org/api/v0/stream?vsn=${vsn}&name=sys.scheduler.status.plugin.*`
  )

  eventSource.onerror = () => {
    console.error('Scheduler status stream error')
    handlers.onError()
  }

  eventSource.onmessage = (e: MessageEvent) => {
    try {
      const record = JSON.parse(e.data)
      if (typeof record.value === 'string') {
        record.value = JSON.parse(record.value)
      }

      const value = record.value as Record<string, unknown>
      const pluginName = typeof value.plugin_name == 'string' ? value.plugin_name : ''
      const pluginTask = typeof value.plugin_task == 'string' ? value.plugin_task : ''

      if (pluginName != task && !pluginTask.startsWith(`${task}-`)) {
        return
      }

      const status: SchedulerStatus = {
        vsn,
        timestamp: record.timestamp || Date.now(),
        status: getSchedulerState(record.name, value),
        nextRun:
          typeof value.nextRun === 'number' || typeof value.nextRun === 'string'
            ? value.nextRun
            : undefined
      }

      handlers.onStatus(status)
    } catch (err) {
      console.error('Failed to parse scheduler status', err)
    }
  }

  return eventSource
}

/**
 * Calculate the next run time from a cron expression.
 * Supports basic cron patterns like: *\/5 * * * * for every 5 minutes.
 */
export const getNextRunTime = (cronExpression: string): Date | null => {
  try {
    const parts = cronExpression.trim().split(/\s+/)
    if (parts.length !== 5) return null

    const [minute, hour] = parts
    const now = new Date()
    const next = new Date(now)
    next.setSeconds(0)
    next.setMilliseconds(0)

    // Parse target minute
    let targetMinute: number
    if (minute.startsWith('*/')) {
      const interval = parseInt(minute.substring(2))
      targetMinute = Math.ceil((now.getMinutes() + 1) / interval) * interval % 60
    } else if (minute !== '*') {
      targetMinute = parseInt(minute)
    } else {
      targetMinute = now.getMinutes() + 1
    }
    next.setMinutes(targetMinute)

    if (hour !== '*' && !hour.startsWith('*/')) {
      // Specific hour: set it and advance to next day if the time has passed
      const targetHour = parseInt(hour)
      next.setHours(targetHour)
      if (next <= now) {
        next.setDate(next.getDate() + 1)
      }
    } else {
      // Wildcard hour: if target minute in current hour has passed, move to next hour
      if (next <= now) {
        next.setHours(next.getHours() + 1)
        next.setMinutes(targetMinute)
      }
    }

    return next
  } catch (err) {
    console.error('Failed to calculate next run time', err)
    return null
  }
}
