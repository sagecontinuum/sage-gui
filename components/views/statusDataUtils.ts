import * as BK from '/components/apis/beekeeper'
import * as BH from '/components/apis/beehive'

import { parseQueryStr } from '/components/utils/queryString'

import settings from '/apps/admin/settings'
import { aggregateMetrics } from '/components/apis/beehive'

const ELAPSED_FAIL_THRES = settings.elapsedThresholds.fail


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

    // ensure the latest time per host is used; mostly for the factory
    if (mostRecent[host]?.localeCompare(timestamp)) {
      return
    }

    const elapsedTime = new Date().getTime() - new Date(timestamp).getTime()
    elapsedByHost[host] = elapsedTime
    mostRecent[host] = timestamp
  })

  return elapsedByHost
}


function getNxMetric(
  metrics: BH.MetricsByHost,
  metricName: string,
  latestOnly = true
) {
  // first find the nx host (16 chars + suffix)
  const hostID = Object.keys(metrics).find(host => host.includes('ws-nxcore'))

  const m = (metrics[hostID] || {})[metricName]
  if (!m) return

  const val = latestOnly ? m[m.length - 1].value : m
  return val
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
    valueObj[host] = val
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
  const notReporting = computes.some(({serial_no}) => {
    const host = BK.findHostWithSerial(Object.keys(elapsedTimes), serial_no)
    return !(host in elapsedTimes) || elapsedTimes[host] > ELAPSED_FAIL_THRES
  })

  return notReporting ? 'not reporting' : 'reporting'
}



const getFakeIP = (id) =>
  `10.11.1${parseInt(id, 16) % 3 + 1}.${Math.floor(Math.random() * 255) + 1}`



// join beehive and beekeeper data, basically
export function mergeMetrics(
  data: BK.State[], records: BH.Record[], health, sanity
) {
  // If a VSN is changed, the data api will return latest records for each VSN.
  // So, we only consider metrics with VSNs which are known by "beekeeper"
  const vsns = data.map(o => o.vsn)
  const metrics = records.filter(m => vsns.includes(m.meta.vsn))
  const byNode = aggregateMetrics(metrics)

  const joinedData = data.map(nodeObj => {
    const vsn = nodeObj.vsn

    if (!byNode || !(vsn in byNode))
      return {...nodeObj, status: 'not reporting (30d+)'}

    const metrics: BH.MetricsByHost = byNode[vsn]

    const elapsedTimes = getElapsedTimes(metrics)

    const temp = getNxMetric(metrics, 'iio.in_temp_input')
    const liveLat = getNxMetric(metrics, 'sys.gps.lat')
    const liveLon = getNxMetric(metrics, 'sys.gps.lon')

    return {
      ...nodeObj,
      temp: temp ? temp / 1000 : -999, // use -999 for better sorting
      status: determineStatus(nodeObj.computes, elapsedTimes),
      elapsedTimes,
      hasStaticGPS: !!nodeObj.gps_lat && !!nodeObj.gps_lon,
      hasLiveGPS: !!liveLat && !!liveLon,
      lat: nodeObj.gps_lat || liveLat,
      lng: nodeObj.gps_lon || liveLon,
      alt: getNxMetric(metrics, 'sys.gps.alt'),
      uptimes: getMetric(metrics, 'sys.uptime'),
      memTotal: getMetric(metrics, 'sys.mem.total'),
      memFree: getMetric(metrics, 'sys.mem.free'),
      memAvail: getMetric(metrics, 'sys.mem.avail'),
      fsAvail: getMetric(metrics, 'sys.fs.avail', false),
      fsSize: getMetric(metrics, 'sys.fs.size', false),
      // cpu: getMetric(metrics, 'sys.cpu_seconds', false),
      // sysTimes: getMetric(metrics, 'sys.time'),
      // txBytes: getMetric(metrics, 'sys.net.tx_bytes', false),
      // txPackets: getMetric(metrics, 'sys.net.tx_packets', false),
      // rxBytes: getMetric(metrics, 'sys.net.rx_bytes', false),
      // rxPackets: getMetric(metrics, 'sys.net.rx_packets', false),
      ip: (getNxMetric(metrics, 'sys.net.ip', false) || []).find(o => o.meta.device == 'wan0')?.value,
      health: {
        sanity: sanity ? countNodeSanity(sanity[vsn]) : {},
        health: health ? countNodeHealth(health[vsn]) : {}
      },
      sensor: nodeObj.sensors.map(o => o.hw_model)
    }
  })

  return joinedData
}


export type FilterState = {
  [filter: string]: string[]
}

export const initialState = {
  status: [],
  project: [],
  location: [],
  focus: [],
  sensor: []
}

export function getFilterState(params) {
  return parseQueryStr<FilterState>(params, {initialState, exclude: ['query', 'phase']})
}

