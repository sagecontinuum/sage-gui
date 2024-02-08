import config from '../../config'
export const url = config.beehive

import { handleErrors } from '../fetch-utils'
import { groupBy, mapValues, flatten } from 'lodash'


import * as BK from '/components/apis/beekeeper'

let _controller

export function abort(){
  if (!_controller) return
  _controller.abort()
}


export const cameraOrientations = [
  'top',
  'left',
  'right',
  'bottom'
]



export type Params = {
  start?: string | Date
  end?: string | Date
  tail?: number
  filter?: {
    [tag: string]: string
  }
}


// standard meta.  todo(nc): break into standard meta and "other" meta
export type Meta = {
  node: string
  host?: string
  vsn?: BK.VSN
  sensor?: string
  plugin?: string
  task?: string
  zone?: string
}

// standard, most common SDR record
export type Record = {
  timestamp: string
  name: string
  value: string | number
  meta: Meta
}

// records for sanity metrics
export type SanityMetric = Record & {
  meta: {
    severity: 'fatal' | 'warning'
  }
}

// type for things like aggregation of sanity metrics
export type ByMetric = {
  [metric: string]: Record[]
}

// (client side) record type for things stored in OSN
export type OSNRecord = Record & {
  value: string   // file paths only
  size: number
}

export type MetricsByHost = {
  [host: string]: {
    [metricName: string]: Record[] | SanityMetric[]
  }
}

// standard struct for grouping of metrics
type AggMetrics = {
  [vsn: string]: MetricsByHost
}


export type ByNodeByName = {
  [vsn: string]: {
    [name: string]: Record[]
  }
}


function post(endpoint: string, data = {}, signal) {
  return fetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    ...(signal ? {signal} : {})
  }).then(handleErrors)
}



export async function getData(params: Params, abortable?: boolean) : Promise<Record[]> {
  let signal
  if (abortable) {
    _controller = new AbortController()
    signal = _controller.signal
  }

  const res = await post(`${url}/query`, params, signal)
  const text = await res.text()

  if (!text)
    return []

  const metrics = text.trim()
    .split('\n')
    .map(str => JSON.parse(str))

  return metrics
}


export const NODE_STATUS_RANGE = '-30d'

export function getNodeData() : Promise<Record[]> {
  const proms = [
    getData({start: NODE_STATUS_RANGE, filter: {name: 'sys.uptime'}, tail: 1}),
    getData({start: '-6m', filter: {name: 'sys.gps.*'}, tail: 1}),
  ]

  return Promise.all(proms)
    .then((recs) => flatten(recs))
}



export function getNodeAdminData() : Promise<Record[]> {
  const proms = [
    getData({start: NODE_STATUS_RANGE, filter: {name: 'sys.uptime'}, tail: 1}),
    getData({start: '-6m', filter: {name: 'sys.gps.*|sys.mem.*|sys.mem.*|sys.fs.*'}, tail: 1}),
    getData({start: '-6m', filter: {sensor: 'bme280', name: 'iio.in_temp_input'}, tail: 1})
  ]

  return Promise.all(proms)
    .then((recs) => flatten(recs))
}



export function getFactoryData() : Promise<Record[]> {
  const proms = [
    getData({start: '-30d', filter: {name: 'sys.uptime'}, tail: 1}),
    getData({start: '-4d', filter: {name: 'sys.net.ip', device: 'wan0'}, tail: 1}),
    getData({start: '-6m', filter: {sensor: 'bme280', name: 'iio.in_temp_input'}, tail: 1})
  ]

  return Promise.all(proms)
    .then((recs) => flatten(recs))
}



export async function getSimpleNodeStatus(vsn: string) : Promise<Record[]> {
  const params = {start: '-4d', filter: {name: 'sys.uptime', vsn}, tail: 1}
  const metrics = await getData(params)
  return metrics
}



export function aggregateMetrics(data: Record[]) : AggMetrics {
  if (!data.length)
    return null

  const byNode = {}
  data.forEach(obj => {
    const {timestamp, name, value, meta} = obj
    const {node, vsn} = meta
    let {host} = meta

    // todo(nc): temp solution since IPs don't have a host?
    if (name == 'sys.net.ip') {
      host = `${node}.ws-nxcore`
    }

    // if no node or host, don't include in aggregation
    if (!vsn || !host) {
      return
    }

    // add entry for node
    if (!(vsn in byNode))
      byNode[vsn] = {}

    if (!(host in byNode[vsn]))
      byNode[vsn][host] = {}

    const nodeData = byNode[vsn][host]

    // append data
    const record = {timestamp, value, meta}

    if (name in nodeData)
      nodeData[name].push(record)
    else
      nodeData[name] = [record]
  })

  return byNode
}


type HealthTestArgs = {
  vsn?: BK.VSN,
  start?: string
  device?: string
}

type SanityTestArgs = {
  vsn?: BK.VSN,
  start?: string
  end?: string
  name?: string
}


export async function getHealthData(args?: HealthTestArgs) : Promise<ByMetric> {
  const {vsn, start} = args || {}

  const params = {
    start: start ?? '-60h',
    bucket: 'health-check-test',
    filter: {
      name: 'node_health_check',
      ...(vsn && {vsn})
    }
  }

  const [data, nodes] = await Promise.all([getData(params), BK.getNodeMeta()])
  const byNode = groupBy(data, 'meta.vsn')

  // removed unbuilt nodes
  Object.keys(byNode).forEach(key => {
    if (!(key in nodes)) delete byNode[key]
  })

  return byNode
}



export async function getSanityData(args?: SanityTestArgs & {tail?: number}) : Promise<AggMetrics> {
  const {vsn, start = '-2d', end, name, tail} = args || {}

  const params = {
    start: start,
    ...(end && {end}),
    filter: {
      name: name || 'sys.sanity_status.*',
      ...(vsn && {vsn})
    },
    ...(tail && {tail}),
  }

  const sanityTests = await getData(params)
  const byNode = aggregateMetrics(sanityTests)

  return byNode
}



export async function getDeviceHealthSummary(args?: HealthTestArgs & {tail?: number}) :
Promise<ByMetric | ByNodeByName> {
  const {vsn, start, device, tail} = args || {}

  const params = {
    start: start ?? '-60h',
    bucket: 'health-check-test',
    filter: {
      name: 'device_health_check',
      ...(vsn && {vsn}),
      ...(device && {device}),
    },
    ...(tail && {tail}),
  }

  const data = await getData(params)
  const byNode = groupBy(data, 'meta.vsn')
  const byNodeByName: ByNodeByName = {}
  mapValues(byNode, (objs, id) => byNodeByName[id] = groupBy(objs, 'meta.device'))

  return vsn ? byNodeByName[vsn] : byNodeByName
}



export async function getSanitySummary(args?: SanityTestArgs) : Promise<ByMetric> {
  const {vsn, start} = args || {}

  const params = {
    bucket: 'downsampled-test',
    start: start ?? '-60h',
    filter: {
      name: 'sanity_test_.*',
      ...(vsn && {vsn})
    }
  }

  const data = await getData(params)
  const byNode: {[vsn: string]: Record[]} = groupBy(data, 'meta.vsn')

  // group records on the names of counts. i.e.,
  // {sanity_test_fail_total: [...], sanity_test_pass_total: [...], sanity_test_total: [...]}
  const byNodeByName: ByNodeByName = {}
  mapValues(byNode, (objs, id) => byNodeByName[id] = groupBy(objs, 'name'))

  // summarize the tests by node
  const summary: ByMetric = {}
  Object.entries(byNodeByName).forEach(([vsn, obj]) => {
    const failObjs = obj['sanity_test_fail_total']
    const totalObjs = obj['sanity_test_total']

    if (failObjs.length !== totalObjs.length) {
      throw 'something has gone terribly wrong with the influxdb aggregator!'
    }

    const mergedObjs = failObjs.map((o, i) => ({
      ...o,
      totalCount: totalObjs[i].value
    })).filter(o => o.totalCount !== 0)

    summary[vsn] = mergedObjs
  })

  return summary
}



async function _findLatestAvail(
  data: Record[],
  position?: string,
  onProgress?: (position: string, remaining: number) => void
) : Promise<OSNRecord> {
  if (!data)
    return null

  // we'll start with newest
  data.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  // sequentially attempt to fetch data until we get a 200 response (and include size)
  let latest, i = 1
  for (const obj of data) {
    latest = await fetch(obj.value.toString(), {method: 'HEAD'})
      .then(res => {
        if (onProgress) {
          onProgress(position, i)
        }

        const size = parseInt(res.headers.get('x-object-content-length') || res.headers.get('content-length'))
        return res.ok ? {...obj, size} : null
      })

    i++

    if (latest) break
  }

  return latest
}



export async function getRecentImages(
  vsn: BK.VSN,
  onStart?: (position: string, total: number) => void,
  onProgress?: (position: string, num: number) => void
) : Promise<{[position: string]: OSNRecord}> {
  // requests for each orientation
  const reqs = cameraOrientations.map(pos => {
    const params = {
      start: '-1d',
      filter: {
        name: 'upload',
        vsn,
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
        d = d.filter(o => /\.jpg$/g.test(o.value as string)) // need to only consider images
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



export async function getLatestAudio(vsn: BK.VSN) {
  const data = await getData({
    start: '-1d',
    filter: {
      name: 'upload',
      vsn,
      filename: '*.flac',
    }
  })

  const latestAvail = await _findLatestAvail(data)

  return latestAvail
}


type RecentRecArgs = {
  node?: string  // todo(nc): remove?
  vsn?: string
  name?: string
  sensor?: string
  start?: string // default: '-4d'
  tail?: number  // default: 1
}

export async function getRecentRecord(args: RecentRecArgs) : Promise<Record[]> {
  const {node, vsn, name, sensor, start = '-4d', tail = null} = args

  const data = await getData({
    start,
    filter: {
      ...(node && {node}),
      ...(vsn && {vsn}),
      ...(name && {name}),
      ...(sensor && {sensor})
    },
    ...(tail && {tail})
  })

  // take sort in event that the VSN or id changed
  return data.sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
}


export type GPS = {lat: number, lon: number, timestamp: string}

export async function getGPS(vsn: string) : Promise<GPS> {
  const d = await getData({start: '-30d', filter: {name: 'sys.gps.*', vsn}, tail: 1})

  const latRecord = d.find(o => o.name === 'sys.gps.lat')
  const lonRecord = d.find(o => o.name === 'sys.gps.lon')
  const lat = latRecord?.value as number
  const lon = lonRecord?.value as number

  if (!lat || !lon)
    return null

  return {
    lat,
    lon,
    timestamp: latRecord.timestamp // note: gps components have same timestamp
  }
}


type PluginCountsProps = {
  start?: string | Date,
  end?: string | Date,
  vsn?: string,
  plugin?: string
  tail?: number
}

export async function getPluginCounts(props: PluginCountsProps) : Promise<Record[]> {
  const {start, end, vsn, plugin, tail} = props

  const params = {
    bucket: 'plugin-stats',
    start: start || '-30d',
    ...(end && {end}),
    ...(tail && {tail}),
    filter: {
      ...(vsn && {vsn}),
      ...(plugin && {plugin})
    }
  }

  const data = await getData(params)
  return data
}
