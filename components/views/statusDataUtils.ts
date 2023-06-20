import * as BK from '/components/apis/beekeeper'
import * as BH from '/components/apis/beehive'

import settings from '/apps/admin/settings'
import { aggregateMetrics } from '/components/apis/beehive'


const ELAPSED_FAIL_THRES = settings.elapsedThresholds.fail
const HOST_SUFFIX_MAPPING = settings.hostSuffixMapping



export function filterData(data: object[], state: object) {
  const filteredRows = data.filter(row => {

    let keep = true
    for (const [field, filters] of Object.entries(state)) {
      if (!filters.length) continue

      if (Array.isArray(row[field])) {
        keep = new Set([...filters].filter((x) => new Set(row[field]).has(x))).size > 0
        if (keep) break
      }

      if (!filters.includes(row[field])) {
        keep = false
        break
      }
    }

    return keep
  })

  return filteredRows
}


function getElapsedTimes(metrics: BH.MetricsByHost) {
  const elapsedByHost = {}

  const mostRecent = {}
  Object.keys(metrics).forEach(host => {
    const uptimes = metrics[host]['sys.uptime']

    // there may not be metrics in last x days
    if (!uptimes) return

    const timestamp = uptimes[0].timestamp

    const suffix = host.split('.')[1]
    const key = suffix ? (HOST_SUFFIX_MAPPING[suffix] || suffix) : host

    // ensure the latest time per host is used; mostly for the factory
    if (mostRecent[key]?.localeCompare(timestamp)) {
      return
    }

    const elapsedTime = new Date().getTime() - new Date(timestamp).getTime()
    elapsedByHost[key] = elapsedTime
    mostRecent[key] = timestamp
  })

  return elapsedByHost
}


function getMetric(
  metrics: BH.MetricsByHost,
  metricName: string,
  latestOnly = true
) {
  const valueObj = {}
  Object.keys(metrics).forEach(host => {
    const m = metrics[host][metricName]
    if (!m) return

    const val = latestOnly ? m[m.length - 1].value : m

    const suffix = host.split('.')[1]
    const key = suffix ? (HOST_SUFFIX_MAPPING[suffix] || suffix) : host
    valueObj[key] = val
  })

  return valueObj
}


export function countNodeHealth(data) {
  if (!data) return {}

  let passed = 0, failed = 0
  data.forEach(obj => {
    const {value} = obj
    passed = value == 1 ? passed + 1 : passed
    failed = value <= 0 ? failed + 1 : failed
  })

  return {
    details: data.sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    passed,
    failed
  }
}



export function countNodeSanity(data) {
  if (!data) return {}

  let passed = 0, failed = 0
  data.forEach(obj => {
    const {value} = obj
    passed = value == 0 ? passed + 1 : passed
    failed = value > 0 ? failed + 1 : failed
  })

  return {
    details: data.sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    passed,
    failed
  }
}



const determineStatus = (computes: BK.Compute[], elapsedTimes: {[host: string]: number}) => {
  if (computes.some(({name}) => !(name in elapsedTimes) || elapsedTimes[name] > ELAPSED_FAIL_THRES))
    return 'not reporting'
  return 'reporting'
}



const getFakeIP = (id) =>
  `10.11.1${parseInt(id, 16) % 3 + 1}.${Math.floor(Math.random() * 255) + 1}`



// join beehive and beekeeper data, basically
export function mergeMetrics(
  data: BK.SimpleManifest[], records: BH.Record[], health, sanity
) {
  // If a VSN is changed, the data api will return latest records for each VSN.
  // So, we only consider metrics with VSNs which are known by "beekeeper"
  const vsns = data.map(o => o.vsn)
  const metrics = records.filter(m => vsns.includes(m.meta.vsn))
  const byNode = aggregateMetrics(metrics, true)

  const joinedData = data.map(nodeObj => {
    const vsn = nodeObj.vsn

    if (!byNode || !(vsn in byNode))
      return {...nodeObj, status: 'offline'}

    const metrics: BH.MetricsByHost = byNode[vsn]

    const elapsedTimes = getElapsedTimes(metrics)

    const temp = getMetric(metrics, 'iio.in_temp_input').nx
    const liveLat = getMetric(metrics, 'sys.gps.lat').nx
    const liveLon = getMetric(metrics, 'sys.gps.lon').nx

    return {
      ...nodeObj,
      temp: temp ? temp / 1000 : -999, // use -999 for better sorting
      status: determineStatus(nodeObj.computes, elapsedTimes),
      elapsedTimes,
      hasStaticGPS: !!nodeObj.gps_lat && !!nodeObj.gps_lon,
      hasLiveGPS: !!liveLat && !!liveLon,
      lat: nodeObj.gps_lat || liveLat,
      lng: nodeObj.gps_lon || liveLon,
      alt: getMetric(metrics, 'sys.gps.alt').nx,
      uptimes: getMetric(metrics, 'sys.uptime'),
      memTotal: getMetric(metrics, 'sys.mem.total'),
      memFree: getMetric(metrics, 'sys.mem.free'),
      memAvail: getMetric(metrics, 'sys.mem.avail'),
      fsAvail: getMetric(metrics, 'sys.fs.avail', false),
      fsSize: getMetric(metrics, 'sys.fs.size', false),
      // cpu: getMetric(byNode, 'sys.cpu_seconds', false),
      // sysTimes: getMetric(byNode, 'sys.time'),
      // txBytes: getMetric(byNode, 'sys.net.tx_bytes', false),
      // txPackets: getMetric(byNode, 'sys.net.tx_packets', false),
      // rxBytes: getMetric(byNode, 'sys.net.rx_bytes', false),
      // rxPackets: getMetric(byNode, 'sys.net.rx_packets', false),
      ip: getMetric(metrics, 'sys.net.ip', false)?.nx?.find(o => o.meta.device == 'wan0')?.value,
      health: {
        sanity: sanity ? countNodeSanity(sanity[vsn]) : {},
        health: health ? countNodeHealth(health[vsn]) : {}
      }
    }
  })

  return joinedData
}


export type FilterState = {
  [filter: string]: string[]
}

const initialState = {
  status: [],
  project: [],
  location: [],
  focus: [],
  sensor: []
}


export function getFilterState(params) {
  const init = {...initialState}
  for (const [key, val] of params) {
    if (['query', 'phase'].includes(key)) continue
    init[key] = JSON.parse(`[${val}]`)
  }

  return init
}

