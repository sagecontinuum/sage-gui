import config from '../../config'
const url = config.beehive


export const cameraOrientations = [
  'top',
  'left',
  'right',
  'bottom'
]



type Params = {
  start: string
  end?: string
  tail?: number
  filter?: {
    [tag: string]: string
  }
}

export type Record = {
  timestamp: string
  name: string
  value: string | number
  meta: {
    node: string
    host?: string
    vsn?: string
  }
}


export type SanityMetric = Record & {
  meta: {
    severity: 'fatal' | 'warning'
  }
}


export type AggMetrics = {
  [nodeID: string]: {
    [host: string]: {
      [metricName: string]: Record[] | SanityMetric[]
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



export async function getData(params: Params) : Promise<Record[]> {
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
  return metrics?.pop().meta.vsn
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



function aggregateMetrics(data: Record[]) : AggMetrics {
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



function aggregatePerNode(data: Record[]) : AggMetrics {
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
    }
  }

  if (node)  {
    params.filter['node'] = node
  }

  const sanityTests = await getData(params)
  const byNode = aggregateMetrics(sanityTests)

  return byNode
}



type StorageRecord = Record & {
  size: number
}


async function _findLatestAvail(data: Record[]) : Promise<StorageRecord> {
  if (!data)
    return null

  // we'll start with newest
  data.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  // sequentially attempt to fetch data until we get a 200 response (and include size)
  let latest
  for (const obj of data) {
    latest = await fetch(obj.value.toString())
      .then(res => {
        const size = parseInt(res.headers.get('content-length'))
        return res.ok ? {...obj, size} : null
      })

    if (latest) break
  }

  return latest
}



export async function getLatestImages(node: string) {
  // requests for each orientation
  const reqs = cameraOrientations.map(pos => {
    const params = {
      start: '-1d',
      filter: {
        name: 'upload',
        node,
        task: `imagesampler-${pos}`
      }
    }

    return getData(params)
  })


  // find latest in storage for each position
  const mapping = Promise.all(reqs)
    .then(async (data) => {
      const proms = data.map(d => _findLatestAvail(d))
      const dataList = await Promise.all(proms)

      // reduce into mapping: {top: [...], left, [...], ... ,}
      const dataByPos = cameraOrientations.reduce((acc, pos, i) => ({
        ...acc,
        [pos]: dataList[i]
      }), {})

      return dataByPos
    })

  return mapping
}



export async function getLatestAudio(node: string) {

  const data = await getData({
    start: '-1d',
    filter: {
      name: 'upload',
      node,
      filename: '*.flac',
    }
  })

  const latestAvail = await _findLatestAvail(data)

  return latestAvail
}


export async function stressTest(node: string) {
  const query = {
    start: '-1d',
    filter: {
      name: 'upload',
      node,
      filename: '*.flac',
    }
  }

  const data = await getData(query)

  return [data, query]
}


