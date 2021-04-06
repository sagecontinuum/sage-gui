import config from '../../config'
const url = config.beehive


type Params = {
  start: string
  end?: string
  filter?: {
    [tag: string]: string
  }
}

type Metric = {
  timestamp: string
  name: string
  value: string | number
  meta: {
    node: string
    host: string
  }
}

export type AggMetrics = {
  [nodeID: string]: {
    [host: string]: {
      [metricName: string]: Metric[]
    }
  }
}


function handleErrors(res) {
  if (res.ok) {
    return res
  }

  return res.json().then(errorObj => {
    throw Error(errorObj.error)
  })
}


function post(endpoint: string, data = {}) {
  return fetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  }).then(handleErrors)
}



async function fetchStatus(params: Params) : Promise<Metric[]> {
  const res = await post(`${url}/query`, params)
  const text = await res.text()

  if (!text)
    return null

  const metrics = text.trim()
    .split('\n')
    .map(str => JSON.parse(str))

  return metrics
}



export async function getLatestMetrics(params?: Params) : Promise<AggMetrics> {
  const metrics = await fetchStatus(params || {start: '-5m', filter: {name: 'sys.*'}})

  // first aggregate all the metrics
  const byNode = aggregateMetrics(metrics)

  // now take the latest sets of (based on timestamps)
  let latestMetrics = {}
  for (const [node, byHost] of Object.entries(byNode)) {
    latestMetrics[node] = {}
    for (const [host, metricObj] of Object.entries(byHost)) {
      latestMetrics[node][host] = {}
      for (const [mName, entries] of Object.entries(metricObj)) {
        latestMetrics[node][host][mName] = getLatestEntries(entries)
      }
    }
  }

  return latestMetrics
}



function aggregateMetrics(data: Metric[]) : AggMetrics {
  if (!data)
    return {}

  let byNode = {}
  data.forEach(obj => {
    const {timestamp, name, value, meta} = obj
    const {node, host} = meta

    // add entry for node
    if (!(node in byNode))
      byNode[node] = {}

    if (!(host in byNode[node]))
      byNode[node][host] = {}


    let nodeData = byNode[node][host]

    // append data
    const record = {timestamp, value, meta}
    if (name in nodeData)
      nodeData[name].push(record)
    else
      nodeData[name] = [record]
  })

  // sort all entries
  for (const host of Object.values(byNode)) {
    for (const metricObj of Object.values(host)) {
      for (const entries of Object.values(metricObj)) {
        entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() )
      }
    }
  }

  return byNode
}



function getLatestEntries(entries) {
  const latest = []

  const lastTimestamp = entries[entries.length - 1].timestamp

  let i = entries.length
  while (i--) {
    const entry = entries[i]
    if (entry.timestamp != lastTimestamp)
      break

    latest.push(entry)
  }

  return latest
}


function getSysActivity() {
  // implement
}
