import config from '../../config'
const url = config.beehive


type Params = {
  start: string
  end?: string
  tail?: number
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



export async function getLatestMetrics(
  params: Params = {start: '-4320h', filter: {name: 'sys.*'}, tail: 1},
  mostRecent = true
) : Promise<AggMetrics> {

  const allMetrics = await fetchStatus(params)

  // first aggregate all the metrics
  const byNode = aggregateMetrics(allMetrics)

  let metrics = mostRecent ? {} : byNode
  if (mostRecent) {
    // take the latest sets of (based on timestamps)
    for (const [node, byHost] of Object.entries(byNode)) {
      metrics[node] = {}
      for (const [host, metricObj] of Object.entries(byHost)) {
        metrics[node][host] = {}
        for (const [mName, entries] of Object.entries(metricObj)) {
          metrics[node][host][mName] = getLatestEntries(entries)
        }
      }
    }
  }

  return metrics
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



function getLatestEntries(metrics: Metric[]) : Metric[] {
  const latest = []

  const lastTimestamp = metrics[metrics.length - 1].timestamp

  let i = metrics.length
  while (i--) {
    const entry = metrics[i]
    if (entry.timestamp != lastTimestamp)
      break

    latest.push(entry)
  }

  return latest
}





export async function getNodeActivity(
  node: string,
  start = '-24h'
) : Promise<AggMetrics> {

  node = node.toLowerCase()

  let params = {
    start,
    filter: { name: null, node }
  }

  // todo(ss): provide "OR" option!
  params.filter.name = 'sys.mem.*'
  const memByNode = await getLatestMetrics(params, false)

  params.filter.name = 'sys.cpu_seconds'
  const cpuByNode = await getLatestMetrics(params, false)

  params.filter.name = 'sys.fs.*'
  const fsByNode = await getLatestMetrics(params, false)


  let byHost = {}

  const hosts = Object.keys(memByNode[node])
  hosts.forEach(host => {
    let metricObj = memByNode[node][host]

    // mem
    const memFrees = metricObj['sys.mem.free'].map(o => o.value)
    const memTotals = metricObj['sys.mem.total'].map(o => o.value)
    const memUsed = memFrees.map((free, i) => memTotals[i] - free)
    const memPercent = memUsed.map((used, i) => used / memTotals[i] * 100)

    // cpu
    metricObj = cpuByNode[node][host]
    let maxCpu = 0
    const cpu = metricObj['sys.cpu_seconds'].map(o => {
      if (o.value > maxCpu)
        maxCpu = o.value
      return o.value
    })


    byHost[host] = {
      memUsed,
      memPercent,
      memTotal: memTotals[0], // todo: close enough
      cpu,
      maxCpu,
      // fsUsed,
      // fsTotal: fsSizes[0]
    }
  })

  return byHost
}


