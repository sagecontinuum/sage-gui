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



export async function getLatestMetrics(params?: Params) : Promise<AggMetrics> {
  params = params || {start: '-4320h', filter: {name: 'sys.*'}, tail: 1}

  const allMetrics = await fetchStatus(params)

  // aggregate all the metrics
  const byNode = aggregateMetrics(allMetrics)

  return byNode
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

  return byNode
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
  const memByNode = await getLatestMetrics(params)

  params.filter.name = 'sys.cpu_seconds'
  const cpuByNode = await getLatestMetrics(params)

  params.filter.name = 'sys.fs.*'
  const fsByNode = await getLatestMetrics(params)


  let byHost = {}

  const hosts = Object.keys(memByNode[node])
  hosts.forEach(host => {
    let metricObj = memByNode[node][host]

    // mem
    const memFrees = metricObj['sys.mem.free'].map(o => o.value)
    const memTotals = metricObj['sys.mem.total'].map(o => o.value)
    const memUsed = memFrees.map((free, i) => Number(memTotals[i]) - Number(free))
    const memPercent = memUsed.map((used, i) => used / Number(memTotals[i]) * 100)

    // cpu
    metricObj = cpuByNode[node][host]
    let maxCpu = 0
    const cpu = metricObj['sys.cpu_seconds'].map(o => {
      if (o.value > maxCpu)
        maxCpu = Number(o.value)
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


