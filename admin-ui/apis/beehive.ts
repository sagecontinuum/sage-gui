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



async function getData(params: Params) : Promise<Metric[]> {
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
  const allMetrics = await getData(params)

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


