
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
}

export type GoalEvent = Event & {
  name: typeof goalEventTypes[number]
  value: {
    goal_id: string
    goal_name: string
  }
}

export type ESRecord = PluginEvent | GoalEvent