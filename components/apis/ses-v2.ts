import * as BH from './beehive'
import type { VSN } from './beekeeper'

import type { Job } from './ses'

import { groupBy } from 'lodash'
import { handleErrors } from '../fetch-utils'

import config from '/config'
const url = config.es

import Auth from '/components/auth/auth'
const __token = Auth.token


const options = {
  headers: __token ? {
    Authorization: `Sage ${__token}`
  } : {}
}

function get(endpoint: string, opts = options) {
  return fetch(endpoint, opts)
    .then(handleErrors)
    .then(res => res.json())
}



const pluginEventTypes = [
  'sys.scheduler.status.plugin.queued',
  'sys.scheduler.status.plugin.selected',   // indicates that agiven scheduling policy selected the plugin to schedule
  'sys.scheduler.status.plugin.scheduled',      // created a Pod for the plugin
  'sys.scheduler.status.plugin.initializing',   // initContainer is running or plugin container image is being pulled
  'sys.scheduler.status.plugin.running',
  'sys.scheduler.plugin.lastexecution',
  'sys.scheduler.status.plugin.failed',
  'sys.scheduler.status.plugin.complete',
  'sys.scheduler.status.plugin.launched',
]


export type StandardMessage = {
  timestamp: string
  name: string
  meta: {
    node: string
    vsn: string
  }
}

export type PluginEvent = StandardMessage & {
  name: typeof pluginEventTypes[number]
  value: {
    goal_id: string
    k3s_pod_instance?: string  // only available in newer data (ex: `app-name-PHMwrO`)
    k3s_pod_name: string       // `app-name-PHMwrO` in older data and `app-name-{jobid}` in newer data
    k3s_pod_node_name: string
    k3s_pod_status: string
    plugin_args: string
    plugin_image: string
    plugin_name: string
    plugin_selector: string
    plugin_status_by_scheduler: string
    plugin_task: string
  }
  status: 'failed' | 'launched' | 'running' | 'complete'
  // computed client-side
  end?: number
  runtime?: number
}


type FailedEvent = PluginEvent & {
  name: typeof pluginEventTypes[number]
  value: PluginEvent['value'] & {
    error_log: string
    k3s_pod_name: 'Failed'
  }
}


// derived data, by computing metrics on PluginEvents
export type GoalLookup = {
  [id: string]: [name: string]
}

// states from services
export type State =
  'Created' | 'Submitted' | 'Running' | 'Completed' |
  'Failed' | 'Suspended' | 'Removed'



export type ESRecord = PluginEvent

// derived data, by computing metrics on PluginEvents
export type Goal = {
  id: string
  name: string
  appCount?: number
  metrics?: {
    [appName: string]: number
  }
}

const parseESRecord = (data) : ESRecord[] =>
  data.map(o => ({
    ...o,
    value: JSON.parse(o.value)
  }))


export type ErrorsByGoalID = {
  [goal_id: string]: FailedEvent[]
}


type GetEventsArgs = {
  start?: Date | string
  vsns?: VSN[]
}

type Event = {
  timestamp: string
  message: string
  reason: 'Plulled' | 'Started' | 'Created'
}

type Task = {
 node: string             // 000048b02d15bc7c,
  vsn: string             // W023, ,
  goal_id: string         // e8dfbf73-8d87-41b4-7129-c8710c8cf21e,
  plugin_task: string     // mysecondapp-42,
  plugin_name: string     // mysecondapp,
  plugin_selector: string // or null,        // resource labels for apps to select which device it needs to run on.
  pluginruntime_pod_instance: string // mysecondapp-RNARqg,
  plugin_args: string     // -c echo hello world; sleep 30; echo bye,
  plugin_image: string    // registry.sagecontinuum.org/theone/imagesampler:0.3.0,

  queued_reason: string   // triggered by cronjob(mysecondapp, * * * * *), // or null
  selected_reason: string // Fit to resource,                  // or null
  k3s_pod_uid: string     // 2b9009f0-20e6-4a57-9408-d883095e11a7, // or null

  queued_start: string
  selected_start?: string
  scheduled_start?: string
  initializing_start?: string
  running_start?: string
  end_time?: string      // "completed" OR "failed"

  failed_start?: string  // todo(nc): remove in favor of "failed" boolean?

  // is some k3s_pod_status debugging needed?
  initializing_k3s_pod_status: 'Pending',
  running_k3s_pod_status: 'Running',
  completed_k3s_pod_status: 'Succeeded',

  events: Event[]

  metric_queued?: number
  metric_selected?: number
  metric_scheduled?: number
  metric_initializing?: number
  metric_running?: number
}

const emptyTask = {
  pluginruntime_pod_instance: null,
  node: null,
  vsn: null,
  events: [],
  queued_start: null,
  selected_start: null,
  scheduled_start: null,
  initializing_start: null,
  running_start: null,
  end_time: null,
  metric_queued: null,
  metric_selected: null,
  metric_scheduled: null,
  metric_initializing: null,
  metric_running: null
}


type TasksByApp = {
  [app_name: string]: Task[]
}

export function getTasksByApp(args?: GetEventsArgs) : Promise<TasksByApp> {
  const {start, vsns} = args || {}

  return BH.getData({
    start: start || '-24h',
    filter: {
      name: 'sys.scheduler.status.plugin.*',
      ...(vsns && {vsn: vsns.join('|')})
    }
  }).then(data => parseESRecord(data) as PluginEvent[])
    .then(pluginEvents => {
      return reduceData(pluginEvents)
    })
}



// O(p*t*s) where p:= number of plugins, t:= number of tasks, s:= number of status messages
function reduceData(pluginEvents) {
  const oldRecords = pluginEvents.filter(obj => !obj.value.pluginruntime_pod_instance)
  const oldCount = oldRecords.length

  if (oldCount)
    throw `${oldCount.toLocaleString()} records out
    of ${pluginEvents.length.toLocaleString()} are incompatible
    with the task viewer for this selected range, and so this task view is not yet compatible.`

  const data = groupBy(pluginEvents, 'value.plugin_name')

  const taskByPluginName = {}

  Object.entries(data).forEach(([name, messages]) => {
    const byPodInstance = groupBy(messages, 'value.pluginruntime_pod_instance')

    const tasks = []

    // create single task
    Object.entries(byPodInstance)
      .forEach(([pod, statuses]) => {
        let task = emptyTask

        task.pluginruntime_pod_instance = pod

        statuses.forEach(event => {
          const {timestamp, name, value, meta} = event

          const n = name.split('.').pop()

          if (n == 'complete' || n == 'failed')
            task[`end_time`] = timestamp

          if (n == 'event')
            task.events = [...task.events, event]
          else
            task[`${n}_start`] = timestamp

          if (!task.node || !task.vsn) {
            task = {...task, ...meta}
          }

          task = {...task, ...value}
        })

        // add metrics
        task.metric_queued = timeDiff(task.queued_start, task.selected_start)
        task.metric_selected = timeDiff(task.selected_start, task.scheduled_start)
        task.metric_scheduled = timeDiff(task.scheduled_start, task.initializing_start)
        task.metric_initializing = timeDiff(task.initializing_start, task.running_start)
        task.metric_running = timeDiff(task.running_start, task.end_time)

        tasks.push(task)
      })

    taskByPluginName[name] = tasks
  })

  return taskByPluginName
}



const timeDiff = (start: string , end: string) =>
  (new Date(end).getTime() - new Date(start).getTime()) / 1000



export async function getJobs() : Promise<Job[]> {
  const jobs = await listJobs()

  let jobData
  try {
    jobData = jobs.map((obj) => {
      const {name, job_id, nodes, nodeTags} = obj

      return {
        ...obj,
        ...obj.state,
        id: Number(job_id),
        name,
        nodes: nodes ?
          Object.keys(nodes) :
          (nodeTags ? nodeTags : [])
      }
    })
  } catch(error) {
    console.error('error', error)
  }

  return jobData
}



async function listJobs() : Promise<Job[]> {
  const data = await get(`${url}/jobs/list`, options)
  return data
}
