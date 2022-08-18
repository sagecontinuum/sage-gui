import * as BK from '/components/apis/beekeeper'
import * as BH from '/components/apis/beehive'

import settings from '/apps/admin/settings'
import { aggregateMetrics } from '/components/apis/beehive'


const ELAPSED_FAIL_THRES = settings.elapsedThresholds.fail
const HOST_SUFFIX_MAPPING = settings.hostSuffixMapping



export function queryData(data: object[], query: string) {
  return data.filter(row =>
    Object.values(row)
      .join('').toLowerCase()
      .includes(query.toLowerCase())
  )
}


export function filterData(data: object[], state: object) {
  const filteredRows = data.filter(row => {

    let keep = true
    for (const [field, filters] of Object.entries(state)) {
      if (!filters.length) continue

      if (!filters.includes(row[field])) {
        keep = false
        break
      }
    }

    return keep
  })

  return filteredRows
}


function getElapsedTimes(metrics: BH.AggMetrics, nodeID: string) {
  const byHost = metrics[nodeID]
  const elapsedByHost = {}

  const mostRecent = {}
  Object.keys(byHost).forEach(host => {
    const uptimes = byHost[host]['sys.uptime']

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
  aggMetrics: BH.AggMetrics,
  nodeID: string,
  metricName: string,
  latestOnly = true
) {
  const metricObjs = aggMetrics[nodeID]

  const valueObj = {}
  Object.keys(metricObjs).forEach(host => {
    const m = metricObjs[host][metricName]
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



const determineStatus = (elapsedTimes: {[host: string]: number}) => {
  if (Object.values(elapsedTimes).some(val => val > ELAPSED_FAIL_THRES))
    return 'not reporting'
  return 'reporting'
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
    const id = nodeObj.id.toLowerCase()
    if (!byNode || !(id in byNode))
      return {...nodeObj, status: 'offline'}

    const elapsedTimes = getElapsedTimes(byNode, id)

    const temp = getMetric(byNode, id, 'iio.in_temp_input').nx
    const liveLat = getMetric(byNode, id, 'sys.gps.lat').nx
    const liveLon = getMetric(byNode, id, 'sys.gps.lon').nx

    const vsn = nodeObj.vsn

    return {
      ...nodeObj,
      vsn,
      temp: temp ? temp / 1000 : -999, // use -999 for better sorting
      status: determineStatus(elapsedTimes),
      elapsedTimes,
      hasStaticGPS: !!nodeObj.gps_lat && !!nodeObj.gps_lon,
      hasLiveGPS: !!liveLat && !!liveLon,
      lat: nodeObj.gps_lat || liveLat,
      lng: nodeObj.gps_lon || liveLon,
      alt: getMetric(byNode, id, 'sys.gps.alt').nx,
      uptimes: getMetric(byNode, id, 'sys.uptime'),
      memTotal: getMetric(byNode, id, 'sys.mem.total'),
      memFree: getMetric(byNode, id, 'sys.mem.free'),
      memAvail: getMetric(byNode, id, 'sys.mem.avail'),
      fsAvail: getMetric(byNode, id, 'sys.fs.avail', false),
      fsSize: getMetric(byNode, id, 'sys.fs.size', false),
      // cpu: getMetric(byNode, id, 'sys.cpu_seconds', false),
      // sysTimes: getMetric(byNode, id, 'sys.time'),
      // txBytes: getMetric(byNode, id, 'sys.net.tx_bytes', false),
      // txPackets: getMetric(byNode, id, 'sys.net.tx_packets', false),
      // rxBytes: getMetric(byNode, id, 'sys.net.rx_bytes', false),
      // rxPackets: getMetric(byNode, id, 'sys.net.rx_packets', false),
      ip: getMetric(byNode, id, 'sys.net.ip', false)?.nx?.find(o => o.meta.device == 'wan0')?.value,
      health: {
        sanity: sanity ? countNodeSanity(sanity[vsn]) : {},
        health: health ? countNodeHealth(health[vsn]) : {}
      }
    }
  })

  return joinedData
}



const initialState = {
  status: [],
  project: [],
  location: [],
  focus: []
}


export function getFilterState(params) {
  let init = {...initialState}
  for (const [key, val] of params) {
    if (['query'].includes(key)) continue
    init[key] = JSON.parse(`[${val}]`)
  }

  return init
}

