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

export type Metric = {
  timestamp: string
  name: string
  value: string | number
  meta: {
    node: string
    host: string
    vsn?: string
  }
}


export type SanityMetric = Metric & {
  meta: {
    severity: 'fatal' | 'warning'
  }
}


export type AggMetrics = {
  [nodeID: string]: {
    [host: string]: {
      [metricName: string]: Metric[] | SanityMetric[]
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



export async function getData(params: Params) : Promise<Metric[]> {
  const res = await post(`${url}/query`, params)
  const text = await res.text()

  if (!text)
    return null

  const metrics = text.trim()
    .split('\n')
    .map(str => JSON.parse(str))

  return metrics
}

export async function getVSN(node: string) : Promise<string> {
  const metrics = await getData({start: '-1h', filter: {name: 'sys.uptime', node}, tail: 1})
  return metrics.pop().meta.vsn
}



export async function getLatestMetrics() : Promise<AggMetrics> {
  let params = {start: '-4d', filter: {name: 'sys.*', vsn: '.*'}, tail: 1}
  let allMetrics = await getData(params)

  // aggregate all the metrics
  const byNode = aggregateMetrics(allMetrics)

  return byNode
}

export async function getLatestTemp() {
  let params = {start: '-3m', filter: {sensor: 'bme280'}, tail: 1}
  const allMetrics = await getData(params)
  const byNode = aggregatePerNode(allMetrics)

  return byNode
}


function aggregateMetrics(data: Metric[]) : AggMetrics {
  if (!data)
    return {}

  let byNode = {}
  data.forEach(obj => {
    const {timestamp, name, value, meta} = obj
    const {node, host} = meta

    // if no node or host, don't include in aggregation
    if (!node || !host) {
      return
    }

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

function aggregatePerNode(data: Metric[]) : AggMetrics {
  if (!data)
    return {}

  let byNode = {}
  data.forEach(obj => {
    const {timestamp, name, value, meta} = obj
    const {node} = meta

    // if no node or host, don't include in aggregation
    if (!node) {
      return
    }

    // add entry for node
    if (!(node in byNode))
      byNode[node] = {}

    let nodeData = byNode[node]

    // append data
    const record = {timestamp, value, meta}

    if (name in nodeData)
      nodeData[name].push(record)
    else
      nodeData[name] = [record]
  })

  return byNode
}

export async function getSanityChart(node?: string) : Promise<AggMetrics> {
  const params = {
    start: '-2d',
    filter: {
      name: 'sys.sanity_status.*',
    },
    tail: 48
  }

  if (node)  {
    params.filter['node'] = node
  }

  const sanityTests = await getData(params)
  const byNode = aggregateMetrics(sanityTests)

  return byNode
}


