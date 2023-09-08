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


function getNxMetric<T>(
  metrics: BH.MetricsByHost,
  serial: string,
  metricName: string
) {
  if (!serial) return

  // first find the nx host (16 chars + suffix)
  const host = BK.findHostWithSerial(Object.keys(metrics), serial)

  const m = (metrics[host] || {})[metricName]
  if (!m) return

  const val = m.at(-1).value
  return val as T
}


function getMetricsByHost(
  metrics: BH.MetricsByHost,
  computes: BK.SimpleManifest['computes'],
  metricName: string,
  latestOnly = true
) {

  const valueObj = {}
  Object.keys(metrics).forEach(host => {
    const suffixEnding = host.split('-')[1]  // example: '0123456789abcdef.ws-rpi' -> rpi

    const serial = computes.find(o => o.name == suffixEnding)?.serial_no
    if (!serial) return

    host = BK.findHostWithSerial(Object.keys(metrics), serial)

    const m = metrics[host][metricName]
    if (!m) return

    const val = latestOnly ? m.at(-1).value : m
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


// handy util function for mocking up the factory view
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
    const {vsn, computes} = nodeObj

    if (!byNode || !(vsn in byNode))
      return {...nodeObj, status: 'not reporting (30d+)'}

    const metrics: BH.MetricsByHost = byNode[vsn]

    const elapsedTimes = getElapsedTimes(metrics)

    const nxSerial = computes.find(o => o.name == 'nxcore')?.serial_no

    const temp = getNxMetric<number>(metrics, nxSerial, 'iio.in_temp_input')
    const liveLat = getNxMetric(metrics, nxSerial, 'sys.gps.lat')
    const liveLon = getNxMetric(metrics, nxSerial, 'sys.gps.lon')
    const alt = getNxMetric(metrics, nxSerial, 'sys.gps.alt')

    const {gps_lat, gps_lon} = nodeObj

    return {
      ...nodeObj,
      temp: temp ? temp / 1000 : null,
      status: determineStatus(computes, elapsedTimes),
      elapsedTimes,
      hasStaticGPS: !!gps_lat && !!gps_lon,
      hasLiveGPS: !!liveLat && !!liveLon,
      lat: gps_lat || liveLat,
      lng: gps_lon || liveLon,
      gps_lat,
      gps_lon,
      liveLat,
      liveLon,
      alt,
      uptimes: getMetricsByHost(metrics, computes, 'sys.uptime'),
      memTotal: getMetricsByHost(metrics, computes, 'sys.mem.total'),
      memFree: getMetricsByHost(metrics, computes, 'sys.mem.free'),
      memAvail: getMetricsByHost(metrics, computes, 'sys.mem.avail'),
      fsAvail: getMetricsByHost(metrics, computes, 'sys.fs.avail', false),
      fsSize: getMetricsByHost(metrics, computes, 'sys.fs.size', false),
      // cpu: getMetricsByHost(metrics, 'sys.cpu_seconds', false),
      // sysTimes: getMetricsByHost(metrics, 'sys.time'),
      // txBytes: getMetricsByHost(metrics, 'sys.net.tx_bytes', false),
      // txPackets: getMetricsByHost(metrics, 'sys.net.tx_packets', false),
      // rxBytes: getMetricsByHost(metrics, 'sys.net.rx_bytes', false),
      // rxPackets: getMetricsByHost(metrics, 'sys.net.rx_packets', false),
      ip: Object.values(getMetricsByHost(metrics, computes, 'sys.net.ip'))[0],
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
  city: [],
  state: [],
  focus: [],
  sensor: []
}

export function getFilterState(params) {
  return parseQueryStr<FilterState>(params, {initialState, exclude: ['query', 'phase']})
}

