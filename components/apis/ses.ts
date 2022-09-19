import * as BH from './beehive'
import { groupBy, uniqBy } from 'lodash'

import jobs from '/apps/sage/jobs/jobs.json'

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

// derived data, by computing metrics on PluginEvents
export type GoalLookup = {
  [id: string]: [name: string]
}

// todo(nc): define
export type Job = Record<string, object>


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

function computeAppMetrics(byApp: ByApp) {
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



type ReducedJobData = {
  byNode: {
    [vsn: string]: PluginEvent[]
  }
  goals: Goal[]
  jobs?: {
    [jobName: string]: Job
  }
}

export function reduceData(taskEvents: PluginEvent[], goals: Goal[]) : ReducedJobData {
  // first group by vsn
  const groupedByNode = groupBy(taskEvents, 'meta.vsn')

  // get hash with names
  const goalLookup = goalsToLookup(goals)

  // aggregate start/stops by vsn
  let goalStats = []
  const byNode = {}
  for (const [vsn, events] of Object.entries(groupedByNode)) {
    const byApp = aggregateEvents(events)
    byNode[vsn] = byApp

    const {metrics, goalID} = computeAppMetrics(byApp)

    goalStats.push({
      id: goalID,
      name: goalLookup[goalID],
      appCount: Object.keys(byApp).length,
      metrics
    })
  }

  // we'll need to eventually use set of goal ids since a goal can have many different apps
  // goalStats = uniqBy(goalStats, 'id')

  // organize by orange/red statuses below 'complete'
  // High-level metrics could make this make this clear, in lieu of better design
  for (const [vsn, byApp] of Object.entries(byNode)) {
    for (const [app, objs] of Object.entries(byApp)) {
      byNode[vsn][app] = [
        ...objs.filter(obj => obj.status == 'failed'),
        ...objs.filter(obj => ['launched', 'running'].includes(obj.status)),
        ...objs.filter(obj => obj.status == 'complete')
      ]
    }
  }

  return {byNode, goals: goalStats}
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


const goalsToLookup = (goals: Goal[]) =>
  goals.reduce((acc, o) => ({...acc, [o.id]: o.name}), {})


// fetch tasks state event changes, and parse SES JSON Messages
function getPluginEvents() : Promise<PluginEvent[]> {
  return BH.getData({
    start: '-24h',
    filter: {
      name: 'sys.scheduler.status.plugin.*'
    }
  }).then(data => parseESRecord(data) as PluginEvent[])
}


export async function getAllData() : Promise<ReducedJobData> {
  const [taskEvents, goalEvents] = await Promise.all([getPluginEvents(), getGoals()])

  const {goals, byNode} = reduceData(taskEvents, goalEvents)

  let jobData
  try {
    jobData = Object.keys(jobs).map((name, i) => {
      const {nodes, nodeTags} = jobs[name]
      return {
        id: i + 1, // fake id
        name,
        nodeInfo: nodes ?
          Object.keys(nodes).length :
          (nodeTags ? nodeTags.join(', ') : '?'),
        status: 'running'
      }
    })
  } catch(error) {
    console.error('error', error)
  }

  if (warnings.length) {
    console.warn(warnings.join('\n'))
  }

  return {jobs: jobData, goals, byNode}
}

