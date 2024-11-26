import * as BH from './beehive'
import * as BK from './beekeeper'

import { groupBy } from 'lodash'
import { handleErrors } from '../fetch-utils'
import { downloadFile } from '/components/utils/downloadFile'

import { uniqBy } from 'lodash'

import * as YAML from 'yaml'

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

function getYAML(endpoint: string, opts = options) {
  return fetch(endpoint, opts)
    .then(handleErrors)
    .then(res => res.text())
}

function post(endpoint: string, data = '') {
  return fetch(endpoint, {
    method: 'POST',
    body: data,
    ...options
  }).then(handleErrors)
    .then(res => res.json())
}

// todo(nc): update goals?  These aren't user-facing right now.
const goalEventTypes = [
  'sys.scheduler.status.goal.submitted',
  'sys.scheduler.status.goal.updated',
  'sys.scheduler.status.goal.received',
  'sys.scheduler.status.goal.received.bulk',
  'sys.scheduler.status.goal.removed',
]


const pluginEventTypes = [
  'sys.scheduler.status.plugin.queued',
  'sys.scheduler.status.plugin.selected',   // indicates that agiven scheduling policy selected the plugin to schedule
  'sys.scheduler.status.plugin.scheduled',      // created a Pod for the plugin
  'sys.scheduler.status.plugin.initializing',   // initContainer is running or plugin container image is being pulled
  'sys.scheduler.status.plugin.running',
  'sys.scheduler.status.plugin.completed',
  'sys.scheduler.plugin.lastexecution',
  'sys.scheduler.status.plugin.failed',
  'sys.scheduler.status.plugin.complete',       // "deprecated"
  'sys.scheduler.status.plugin.launched',       // "deprecated"
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
  status: 'failed' | 'launched' | 'running' | 'complete' | 'completed'
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
  'Created' | 'Submitted' | 'Running' | 'Completed' |
  'Failed' | 'Suspended' | 'Removed'

// states in UI which are considered 'Queued"
export type QueuedState = 'Created' | 'Submitted'


type PluginSpec = {
  name: string
  pluginSpec: {
    image: string     // image ref
    args: string[]
  }
}

export type JobTemplate = {
  name: string
  plugins: PluginSpec[]
  nodeTags?: null
  nodes: {
    [vsn: string]: true
  }
  scienceRules: string[]
  successCriteria: string[]
}

type Plugin = PluginSpec & {
  status: {
    scheduling: State
    since: Date       // 2022-11-22T20:35:27.373353828Z
  }
  goal_id: string     // hash
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
  job_id: string
  user: string
  email: string
  notification_on: null // todo(nc): define
  plugins: Plugin[]
  nodeTags: null        // note: not currently used
  nodes: {
    [vsn: string]: true
  },
  science_rules: string[]
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
  job_id: number   // converted from string to number
  nodes: BK.VSN[]
} & JobRecord['state']


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
  project?: BK.Node['project']
  user?: string
}

// todo(nc): handle user filtering in service
async function listJobs(params?: ListJobsParams) : Promise<Job[]> {
  const {user} = params || {}

  let data = user ?
    await get(`${url}/jobs/list`, options) :
    await get(`${url}/jobs/list`, {headers: {}})

  // hashed by job_id; convert to array list
  data = Object.values(data)

  data = user ? data.filter(o => o.user == user) : data

  return data
}


/* todo(nc): need linkage between various pod runs
const queuedSignals = [
  'sys.scheduler.status.plugin.promoted', // deprecated in favor of "queued"
  'sys.scheduler.status.plugin.queued'
]


const selectedSignals = [
  'sys.scheduler.status.plugin.scheduled', // deprecated in favor of "selected"?
  'sys.scheduler.status.plugin.selected'
]

const startStatuses = ['launched', 'initializing']
*/


const startSignals = [
  'sys.scheduler.status.plugin.launched',
]


const endSignals = [
  'sys.scheduler.status.plugin.complete', // deprecated in favor of "completed"
  'sys.scheduler.status.plugin.completed',
  'sys.scheduler.status.plugin.failed'
]


const filterEventsV2 = (o, startList, endList) =>
  startList.includes(o.name) || endList.includes(o.name)

const isDevMode = process.env.NODE_ENV == 'development'
const warnings = []

type EventsByAppName = {
  [appName: string]: (PluginEvent & {end: string})
}

function findEventsByApp(data: PluginEvent[], startList, endList) : EventsByAppName {

  const filtered = data.filter((obj) => filterEventsV2(obj, startList, endList))

  if (isDevMode && data.length != filtered.length) {
    const otherEvents = data.filter(o => !filterEventsV2(o, startList, endList))
    warnings.push(
      `SES events were filtered from ${data.length} to ${filtered.length}\n`,
      'Other events:', uniqBy(otherEvents, 'name').map(o => o.name).join(', ')
    )
  }

  const byPod = groupBy(filtered, 'value.k3s_pod_instance')

  // delete any runs with no k3s_pod_instance?  todo(nc): check with YK
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
      hasStart = startList.includes(name)
      hasEnd = endList.includes(name)
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
        status: 'running', // startObj.name.split('.').pop(),
        runtime: new Date().getTime() - new Date(start).getTime()
      }

      warnings.push(`Note: No end signal found for taskName=${taskName}, timestamp=${start}`)
    }

    if (taskName in byTaskName)
      byTaskName[taskName].push(item)
    else
      byTaskName[taskName] = [item]
  }

  if (isDevMode) {
    console.warn(warnings.join('\n'))
  }

  return byTaskName
}


export type EventsByNode = {
    [vsn: string]: PluginEvent[]
}


export function reduceData(taskEvents: PluginEvent[]) : EventsByNode {
  // first group by vsn
  const groupedByNode = groupBy(taskEvents, 'meta.vsn')

  // aggregate start/stops for each vsn
  const byNode = {}
  for (const [vsn, events] of Object.entries(groupedByNode)) {
    const byApp = findEventsByApp(events, startSignals, endSignals)
    byNode[vsn] = byApp
  }


  // organize by orange/red statuses below 'complete'
  // High-level metrics could make this make this clear, in lieu of better design
  for (const [vsn, byApp] of Object.entries(byNode)) {
    for (const [app, objs] of Object.entries(byApp)) {
      byNode[vsn][app] = [
        ...objs.filter(obj => ['launched', 'running'].includes(obj.status)),
        ...objs.filter(obj => ['complete', 'completed'].includes(obj.status)),
        ...objs.filter(obj => obj.status == 'failed')
      ]
    }
  }

  return byNode
}


// todo(nc): work in progress for new scheduler events
/*
export function reduceDataV2(taskEvents: PluginEvent[]) : EventsByNode {
  // first group by vsn
  const groupedByNode = groupBy(taskEvents, 'meta.vsn')

  // aggregate start/stops by vsn
  const byNode = {}
  for (const [vsn, events] of Object.entries(groupedByNode)) {
    const byAppScheduled = findEventsByApp(events, selectedSignals, startSignals)
    byNode[vsn] = byAppScheduled
  }

  // organize by orange/red statuses below 'complete'
  // High-level metrics could make this make this clear, in lieu of better design
  for (const [vsn, byApp] of Object.entries(byNode)) {
    for (const [app, objs] of Object.entries(byApp)) {
      byNode[vsn][app] = [
        ...objs.filter(obj => startStatuses.includes(obj.status)),
        ...objs.filter(obj => ['complete', 'completed'].includes(obj.status)),
        ...objs.filter(obj => obj.status == 'failed')
      ]
    }
  }

  return byNode
}
*/


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
  vsns?: BK.VSN[]
}

type EventData = {
  events: EventsByNode
  errors: ErrorsByGoalID
}

// fetch tasks state event changes, and parse SES JSON Messages
export function getEvents(args?: GetEventsArgs) : Promise<EventData> {
  const {start, vsns} = args || {}

  return BH.getData({
    start: start || '-24h',
    filter: {
      name: 'sys.scheduler.status.plugin.*',
      ...(vsns && {vsn: vsns.join('|')})
    }
  }).then(data => parseESRecord(data) as PluginEvent[])
    .then(pluginEvents => {
      const errors = pluginEvents.filter(obj => obj.value.k3s_pod_status == 'Failed') as FailedEvent[]
      const errorsByGoalID = groupBy(errors, 'value.goal_id')

      return {
        events: reduceData(pluginEvents),
        errors: errorsByGoalID
      }
    })
}


export async function getJobs(params?: ListJobsParams) : Promise<Job[]> {
  const {user, project} = params || {}

  const prom1 = project ? BK.getNodes({project}) : null

  const [nodes, jobs] = await Promise.all([prom1, listJobs({user})])

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

  if (nodes) {
    const vsns = nodes.map(obj => obj.vsn)
    jobData = jobData.filter(job => job.nodes.filter(vsn => vsns.includes(vsn)).length)
  }


  return jobData
}



export async function getTemplate(
  jobID: number,
  type?: 'yaml' | 'json'
) : Promise<JobTemplate | string> {
  const yaml = await getYAML(`${url}/jobs/${jobID}/template`, options)

  return type == 'yaml' ?
    yaml as string :
    YAML.parse(yaml) as JobTemplate
}



export async function downloadTemplate(jobID: number) {
  getTemplate(jobID, 'yaml')
    .then((spec) => {
      downloadFile(spec as string, `sage-job-${jobID}.yaml`)
    })
}


// submit new job
export async function submitJob(spec: string) {
  const res = await post(`${url}/submit`, spec)
  return res
}


// resubmit for multiple existing jobs
export async function submitJobs(ids: number[]) {
  return Promise.all(ids.map(id => get(`${url}/submit?id=${id}`)))
}


export async function editJob(id: Job['job_id'], spec: string) {
  const res = await post(`${url}/edit?id=${id}`, spec)
  return res
}


type SuspendedJob = {
  job_id: string
  state: 'Suspended'
}

async function suspendJob(id: number) : Promise<SuspendedJob> {
  return await get(`${url}/jobs/${id}/rm?id=${id}&suspend=true`)
}


export async function suspendJobs(ids: number[]) : Promise<SuspendedJob[]> {
  return Promise.all(ids.map(id => suspendJob(id)))
}



type RemovedJob = {
  job_id: string
  state: 'Removed'
}

async function removeJob(id: string) : Promise<RemovedJob> {
  return await get(`${url}/jobs/${id}/rm?id=${id}&force=true`)
}


export async function removeJobs(ids: string[]) : Promise<RemovedJob[]> {
  return Promise.all(ids.map(id => removeJob(id)))
}


