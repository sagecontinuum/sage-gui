import config from '../../config'
const url = config.beehive

import {groupBy, mapValues} from 'lodash'


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


// type for things like aggregation of sanity metrics
export type MetricsObj = {
  [metric: string]: Record[]
}

// (client side) record type for things stored in OSN
export type StorageRecord = Record & {
  size: number
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
  const data = await getData(params)
  const byNode = groupBy(data, 'meta.node')
  mapValues(byNode, (objs, id) => byNode[id] = groupBy(objs, 'name'))

  return byNode
}



function aggregateMetrics(data: Record[]) : AggMetrics {
  if (!data)
    return null

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



export async function getSanityChart(node?: string, start?: string) : Promise<MetricsObj> {
  const params = {
    start: start || '-2d',
    filter: {
      name: 'sys.sanity_status.*',
      ...(node && {node})
    }
  }

  const sanityTests = await getData(params)
  const byNode = aggregateMetrics(sanityTests)

  return byNode
}



export async function getDailyChart(start?: string) : Promise<Record[]> {
  const params = {
    bucket: 'downsampled-test',
    start: start ?? '-7d',
    filter: {
      name: 'sanity_test_.*'
    }
  }

  const data = await getData(params)
  let byNode = groupBy(data, 'meta.node')
  mapValues(byNode, (objs, id) => byNode[id] = groupBy(objs, 'name'))

  Object.entries(byNode).forEach(([id, obj]) => {
    const failObjs = obj['sanity_test_fail_total']
    const totalObjs = obj['sanity_test_total']

    if (failObjs.length !== totalObjs.length) {
      throw 'something has gone terribly wrong with the influxdb aggregator!'
    }

    const mergedObjs = failObjs.map((o, i) => ({
      ...o,
      totalCount: totalObjs[i].value
    })).filter(o => o.totalCount !== 0)

    byNode[id] = mergedObjs
  })

  return byNode
}



export async function getNodeHealth(node?: string, start?: string) : Promise<MetricsObj> {
  const params = {
    start: start || '-2d',
    bucket: 'testing',
    filter: {
      name: 'node_health_check_summary',
      ...(node && {node})
    }
  }

  const data = await getData(params)
  const byNode = groupBy(data, 'meta.node')
  mapValues(byNode, (objs, id) => byNode[id] = groupBy(objs, 'meta.component'))

  return byNode
}



async function _findLatestAvail(
  data: Record[],
  position?: string,
  onProgress?: (position: string, remaining: number) => void
) : Promise<StorageRecord> {
  if (!data)
    return null

  // we'll start with newest
  data.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  // sequentially attempt to fetch data until we get a 200 response (and include size)
  let latest, i = 1
  for (const obj of data) {
    latest = await fetch(obj.value.toString())
      .then(res => {
        if (onProgress) {
          onProgress(position, i)
        }

        const size = parseInt(res.headers.get('content-length'))
        return res.ok ? {...obj, size} : null
      })

    i++

    if (latest) break
  }

  return latest
}



export async function getRecentImages(
  node: string,
  onStart?: (position: string, total: number) => void,
  onProgress?: (position: string, num: number) => void
) : Promise<{[position: string]: StorageRecord}> {
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
      if (onStart) {
        cameraOrientations.forEach((pos, i) => {
          onStart(pos, data[i]?.length)
        })
      }

      const proms = data.map((d, i) => {
        const position = cameraOrientations[i]
        return _findLatestAvail(d, position, onProgress)
      })
      const dataList = await Promise.all(proms)

      // reduce into mapping: {top: {...}, left, {...}, ... ,}
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


