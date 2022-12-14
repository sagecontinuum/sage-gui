import * as BH from './beehive'
import type { VSN } from './beekeeper'
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

function post(endpoint: string, data = '') {
  return fetch(endpoint, {
    method: 'POST',
    body: data,
    ...options
  }).then(handleErrors)
    .then(res => res.json())
}


const jobEventTypes = [
  'sys.scheduler.status.job.suspended',
  'sys.scheduler.status.job.removed'
]

const goalEventTypes = [
  'sys.scheduler.status.goal.submitted',
  'sys.scheduler.status.goal.updated',
  'sys.scheduler.status.goal.received',
  'sys.scheduler.status.goal.received.bulk',
  'sys.scheduler.status.goal.removed',
]

const pluginEventTypes = [
  'sys.scheduler.status.plugin.promoted',
  'sys.scheduler.status.plugin.scheduled',
  'sys.scheduler.status.plugin.launched',
  'sys.scheduler.status.plugin.complete',
  'sys.scheduler.plugin.lastexecution',
  'sys.scheduler.status.plugin.failed',
  'sys.scheduler.failure'
]


export type Event = {
  timestamp: string
  name: string
  meta: {
    node: string
    vsn: string
  }
}

export type PluginEvent = Event & {
  name: typeof pluginEventTypes[number]
  value: {
    goal_id: string
    k3s_job_name: string
    k3s_job_status: string
    k3s_pod_name: string
    k3s_pod_node_name: string
    k3s_pod_status: string
    plugin_args: string
    plugin_image: string
    plugin_name: string
    plugin_selector: string
    plugin_status_by_scheduler: string
    plugin_task: string
  }
  runtime?: number  // computed client-side
}

export type GoalEvent = Event & {
  name: typeof goalEventTypes[number]
  value: {
    goal_id: string
    goal_name: string
  }
}

// derived data, by computing metrics on PluginEvents
export type GoalLookup = {
  [id: string]: [name: string]
}

// states from services
export type State =
  'Created' | 'Submitted' | 'Waiting' | 'Running' | 'Completed' |
  'Failed' | 'Suspended' | 'Removed'

// states in UI which are considered 'Queued"
export type QueuedState = 'Created' | 'Submitted' | 'Waiting'


type Plugin = {
name: string
  plugin_spec: {
    image: string     // image ref
  }
  status: {
    scheduling: State
    since: Date       // 2022-11-22T20:35:27.373353828Z
  }
  goal_id: string       // hash
}



type ScienceGoal = {
  id: string
  job_id: string
  name: string
  sub_goals: object     // todo(nc): define(?)
}


// official SES job type
type JobRecord = {
  name: string
  job_id: string        // string number
  user: string
  email: string
  notification_on: null // todo(nc): define
  plugins: Plugin[]
  node_tags: null,
  nodes: {
    [vsn: string]: true
  },
  science_rules: string[],
  success_criteria: string[]
  science_goal: ScienceGoal[]
  state: {
    last_state: State
    last_updated: Date
    last_submitted: Date
    last_started: Date
    last_completed: null
  }
}

// Job type for UI
export type Job = JobRecord & {
  nodes: BK.VSN[]
}


export type ESRecord = PluginEvent | GoalEvent

// derived data, by computing metrics on PluginEvents
export type Goal = {
  id: string
  name: string
  appCount?: number
  metrics?: {
    [appName: string]: number
  }
}


type ListJobsParams = {
  user?: string
}

// todo(nc): handle user filtering in service
async function listJobs(params?: ListJobsParams) : Promise<Job[]> {
  const {user} = params || {}

  let data = user ?
    await get(`${url}/jobs/list`, options) :
    await get(`${url}/jobs/list`, {})

  // hashed by job_id; convert to array list
  data = Object.values(data)

  data = user ? data.filter(o => o.user == user) : data

  return data
}



const startedSignal = 'sys.scheduler.status.plugin.launched'

const endedSignals = [
  'sys.scheduler.status.plugin.complete',
  'sys.scheduler.status.plugin.failed'
]


const filterEvents = (o) =>
  startedSignal == o.name || endedSignals.includes(o.name)


const warnings = []

type ByTask = {
  [appName: string]: (PluginEvent & {end: string})
}

function aggregateEvents(data: PluginEvent[]) : ByTask {

  // we only care about start / end signals (for now)
  const filtered = data.filter(filterEvents)

  if (process.env.NODE_ENV == 'development' && data.length != filtered.length) {
    const otherEvents = data.filter(o => !filterEvents(o))
    warnings.push(
      `SES events were filtered from ${data.length} to ${filtered.length}\n`,
      'Other events:', otherEvents
    )
  }

  const byPod = groupBy(filtered, 'value.k3s_pod_name')

  // delete any runs with no k3s_pod_name?  todo(nc): check with YK
  delete byPod.undefined

  // create lookup by task name
  const byTaskName = {}
  for (const [podName, events] of Object.entries(byPod)) {
    const taskName = podName.slice(0, podName.lastIndexOf('-'))
    events.sort((a, b) => a.timestamp.localeCompare(b.timestamp))

    let hasStart, hasEnd = false

    // assume at most two events (for now)
    if (events.length == 2) {
      hasStart = hasEnd = true
    } else if (events.length == 1) {
      const name = events[0].name
      hasStart = name == startedSignal
      hasEnd = endedSignals.includes(name)
    } else {
      warnings.push(
        `parseEvents: wrong number of events for ${podName}.`,
        `found ${events.length} events.  was expecting at most 2`
      )
      continue
    }

    let item
    if (hasStart && hasEnd) {
      const [startObj, endObj] = events
      const end = endObj.timestamp
      item = {
        ...startObj,
        end: end,
        status: endObj.name.split('.').pop(),
        runtime: new Date(end).getTime() -  new Date(startObj.timestamp).getTime()
      }
    } else if (hasEnd) {
      warnings.push('todo: add representation for end times with no start?')
      continue
    } else if (hasStart) {
      const startObj = events[0]
      const start = startObj.timestamp

      item = {
        ...startObj,
        end: new Date().toISOString(),
        status: 'running',
        runtime: new Date().getTime() - new Date(start).getTime()
      }

      warnings.push(`Note: No end signal found for taskName=${taskName}, timestamp=${start}`)
    }

    if (taskName in byTaskName)
      byTaskName[taskName].push(item)
    else
      byTaskName[taskName] = [item]
  }

  return byTaskName
}


type ByApp = {
  [name: string]: PluginEvent[]
}

function computeGoalMetrics(byApp: ByApp) {
  let goalID
  const metrics = Object.keys(byApp).reduce((acc, appName) => {
    const appEvents = byApp[appName]

    const meanTime = appEvents.reduce((acc, obj) => acc + obj.runtime, 0) / byApp[appName].length

    if (!goalID) {
      goalID = appEvents[0].value.goal_id
    }

    return {...acc, [appName]: meanTime}
  }, {})

  return {metrics, goalID}
}



export type EventsByNode = {
    [vsn: string]: PluginEvent[]
}

type JobByJobName = {
  [jobName: string]: Job
}

export function reduceData(taskEvents: PluginEvent[]) : EventsByNode {
  // first group by vsn
  const groupedByNode = groupBy(taskEvents, 'meta.vsn')

  // aggregate start/stops by vsn
  const byNode = {}
  for (const [vsn, events] of Object.entries(groupedByNode)) {
    const byApp = aggregateEvents(events)
    byNode[vsn] = byApp
  }

  // organize by orange/red statuses below 'complete'
  // High-level metrics could make this make this clear, in lieu of better design
  for (const [vsn, byApp] of Object.entries(byNode)) {
    for (const [app, objs] of Object.entries(byApp)) {
      byNode[vsn][app] = [
        ...objs.filter(obj => ['launched', 'running'].includes(obj.status)),
        ...objs.filter(obj => obj.status == 'complete'),
        ...objs.filter(obj => obj.status == 'failed')
      ]
    }
  }

  return byNode
}


const parseESRecord = (data) : ESRecord[] =>
  data.map(o => ({
    ...o,
    value: JSON.parse(o.value)
  }))


const goalSignals = [
  'sys.scheduler.status.goal.received',
  'sys.scheduler.status.goal.updated'
]

// currently unused beehive goal parser
function getGoals() : Promise<Goal[]> {
  return BH.getData({
    start: '-365d',
    tail: 1,
    filter: {
      name: 'sys.scheduler.status.goal.*',
    },
  }).then(data => parseESRecord(data))
    .then(data => {

      // only consider "received" and "updated"
      data = data.filter(o => goalSignals.includes(o.name))

      // sort by most recently updated
      data.sort((a,b) => b.timestamp.localeCompare(a.timestamp))

      const byGoal = groupBy(data, 'value.goal_id')

      const rows = Object.keys(byGoal).map(id => ({
        id,
        name: byGoal[id][0].value.goal_name
      }))

      return rows
    })
}


// fetch tasks state event changes, and parse SES JSON Messages
export function getEvents(nodes?: VSN[]) : Promise<EventsByNode> {
  return BH.getData({
    start: '-24h',
    filter: {
      name: 'sys.scheduler.status.plugin.*',
      ...(nodes && {vsn: nodes.join('|')})
    }
  }).then(data => parseESRecord(data) as PluginEvent[])
    .then(pluginEvents => reduceData(pluginEvents))
}


export async function getJobs(params?: ListJobsParams) : Promise<Job[]> {
  const {user} = params || {}

  const jobs = await listJobs({user})

  let jobData
  try {
    jobData = jobs.map((obj) => {
      const {name, job_id, nodes, plugins, nodeTags} = obj

      return {
        ...obj,
        id: job_id,
        name,
        nodes: nodes ?
          Object.keys(nodes) :
          (nodeTags ? nodeTags : '?')
      }
    })
  } catch(error) {
    console.error('error', error)
  }

  return jobData
}



export async function submitJob(spec: string) {
  const res = await post(`${url}/submit`, spec)
  return res
}


type RemovedJob = {
  job_id: string
  state: 'Removed' | string  // todo(nc): other states?
}

async function removeJob(id: string) : Promise<RemovedJob> {
  return await get(`${url}/jobs/${id}/rm?id=${id}&force=true`)
}


export async function removeJobs(ids: string[]) : Promise<RemovedJob[]> {
  return Promise.all(ids.map(id => removeJob(id)))
}


