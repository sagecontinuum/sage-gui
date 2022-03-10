import * as BK from '~/components/apis/beekeeper'
import * as BH from '~/components/apis/beehive'
import * as SES from '~/components/apis/ses'

import config from '../../../config'
import { aggregateMetrics } from '~/components/apis/beehive'


const ELAPSED_FAIL_THRES = config.admin.elapsedThresholds.fail
const HOST_SUFFIX_MAPPING = config.admin.hostSuffixMapping



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
  const byHost = {}

  Object.keys(metrics[nodeID]).forEach(host => {

    const timestamp = metrics[nodeID][host]['sys.uptime'][0].timestamp

    const elapsedTime = (new Date().getTime() - new Date(timestamp).getTime())

    const suffix = host.split('.')[1]
    const key = suffix ? (HOST_SUFFIX_MAPPING[suffix] || suffix) : host
    byHost[key] = elapsedTime
  })

  return byHost
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



function getSanity(
  metrics: BH.AggMetrics,
  nodeID: string
) {
  const metricObjs = metrics[nodeID]

  // todo(nc): assume data is only attached to nx?
  // update when dealing with blades?
  // todo(nc): really should organize this better.
  // i.e., {warnings, failed, details: [...]}
  let valueObj
  Object.keys(metricObjs).forEach(host => {

    if (!host.includes('ws-nxcore'))
      return

    const metric = metricObjs[host]
    if (!metric) return

    let passed = 0
    let warnings = 0
    let failed = 0

    // determine pass ratio
    Object.keys(metric).forEach(key => {
      if (!key.includes('sys.sanity_status'))
        return

      const {value, meta} = metric[key][0]
      const severity = meta['severity']

      passed = value == 0 ? passed + 1 : passed
      warnings = value > 0 && severity == 'warning' ? warnings + 1 : warnings
      failed = value > 0 && severity == 'fatal' ? failed + 1 : failed
    })

    valueObj = metric
    valueObj.passed = passed
    valueObj.warnings = warnings
    valueObj.failed = failed
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
    details: data,
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
    details: data,
    passed,
    failed
  }
}



export function countPluginStatus(data) {
  if (!data) return {}

  let passed = 0, failed = 0
  data.forEach(obj => {
    const {value} = obj

    passed = value == 0 ? passed + 1 : passed
    failed = value > 0 ? failed + 1 : failed
  })

  return {
    details: data,
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
  data: BK.State[], records: BH.Record[], temps, health, sanity
) {
  // If a VSN is changed, the data api will return latest records for each VSN.
  // So, we only consider metrics with VSNs which are known by "beekeeper"
  const vsns = data.map(o => o.vsn)
  const metrics = records.filter(m => vsns.includes(m.meta.vsn))
  const byNode = aggregateMetrics(metrics)

  const joinedData = data.map(nodeObj => {
    const id = nodeObj.id.toLowerCase()
    if (!(id in byNode)) return nodeObj

    const elapsedTimes = getElapsedTimes(byNode, id)

    const nodeTemps = (temps[id] && 'iio.in_temp_input' in temps[id]) ?
      temps[id]['iio.in_temp_input'] : null
    const temp = nodeTemps ? nodeTemps[nodeTemps.length-1].value / 1000 : -999

    const liveLat = getMetric(byNode, id, 'sys.gps.lat').nx
    const liveLon = getMetric(byNode, id, 'sys.gps.lon').nx

    const vsn = nodeObj.vsn

    return {
      ...nodeObj,
      vsn,
      temp,
      status: determineStatus(elapsedTimes),
      elapsedTimes,
      hasStaticGPS: !!nodeObj.gps_lat && !!nodeObj.gps_lon,
      hasLiveGPS: !!liveLat && !!liveLon,
      lat: nodeObj.gps_lat || liveLat,
      lng: nodeObj.gps_lon || liveLon,
      alt: getMetric(byNode, id, 'sys.gps.alt').nx,
      uptimes: getMetric(byNode, id, 'sys.uptime'),
      sysTimes: getMetric(byNode, id, 'sys.time'),
      cpu: getMetric(byNode, id, 'sys.cpu_seconds', false),
      memTotal: getMetric(byNode, id, 'sys.mem.total'),
      memFree: getMetric(byNode, id, 'sys.mem.free'),
      memAvail: getMetric(byNode, id, 'sys.mem.avail'),
      fsAvail: getMetric(byNode, id, 'sys.fs.avail', false),
      fsSize: getMetric(byNode, id, 'sys.fs.size', false),
      txBytes: getMetric(byNode, id, 'sys.net.tx_bytes', false),
      txPackets: getMetric(byNode, id, 'sys.net.tx_packets', false),
      rxBytes: getMetric(byNode, id, 'sys.net.rx_bytes', false),
      rxPackets: getMetric(byNode, id, 'sys.net.rx_packets', false),
      ip: getMetric(byNode, id, 'sys.net.ip', false)?.nx?.find(o => o.meta.device == 'wan0')?.value,
      health: {
        sanity: sanity ? countNodeSanity(sanity[vsn]) : {},
        health: health ? countNodeHealth(health[vsn]) : {}
      }
      // pluginStatus: plugins ? aggPluginStatus(plugins[id.toUpperCase()]) : {}
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

