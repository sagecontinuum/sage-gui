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
  params = params || {start: '-7d', filter: {name: 'sys.*'}, tail: 1}
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


type AggSanityMetrics = {
  items: {date: Date, value: number }[]
  nodes: string[]
}

function aggSanityMetrics(data: Metric[]) : AggSanityMetrics {
  const nodes = []

  // first aggregate by day
  let aggData = {}
  data.forEach(obj => {
    const {timestamp, name, value, meta} = obj
    const {node} = meta

    if (!nodes.includes(node))
      nodes.push(node)

    const day = new Date(timestamp.split('T')[0]).toDateString()
    if (day in aggData)
      aggData[day].data.push(obj)
    else
      aggData[day] = {data: [obj], passed: 0, failed: 0, value: 0}


    aggData[day].passed = value == 0  ? aggData[day].passed + 1 : aggData[day].passed
    aggData[day].failed = value > 0 ? aggData[day].failed + 1 : aggData[day].failed
    aggData[day].value = aggData[day].failed
  })


  const items = Object.keys(aggData)
    .map((k) => ({date: new Date(k), ...aggData[k]}))

  return {items, nodes}
}



export async function getSanityTests(node?: string) {
  const params = {
    start: '-1d',
    filter: {
      name: 'sys.sanity_status.*',
    }
  }

  if (node)  {
    params.filter['node'] = node
  }

  const sanityTests = await fetchStatus(params)

  const byDayData = aggSanityMetrics(sanityTests)

  return byDayData
}


