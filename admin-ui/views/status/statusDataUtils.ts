import * as BK from '../../apis/beekeeper'
import * as BH from '../../apis/beehive'
import * as SES from '../../apis/ses'

import config from '../../../config'


const ELASPED_THRES = 90000

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


function getElaspedTimes(metrics: BH.AggMetrics, nodeID: string) {
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


const determineStatus = (elaspedTimes: {[host: string]: number}) => {
  if (Object.values(elaspedTimes).some(val => val > ELASPED_THRES))
    return 'not reporting'
  return 'reporting'
}



const getFakeIP = (id) =>
  `10.11.1${parseInt(id, 16) % 3 + 1}.${Math.floor(Math.random() * 255) + 1}`



// join beehive and beekeeper data, basically
export function mergeMetrics(
  data: BK.State[], metrics: BH.AggMetrics, temps, health, sanity
) {
  const joinedData = data.map(nodeObj => {
    const id = nodeObj.id.toLowerCase()

    if (!(id in metrics)) return nodeObj

    const elaspedTimes = getElaspedTimes(metrics, id)

    // get vsn from arbitrary host; todo(nc): no longer necessary
    const someHost = Object.keys(metrics[id])[0]
    const vsn = metrics[id][someHost]['sys.uptime'][0].meta.vsn


    const nodeTemps = (temps[id] && 'iio.in_temp_input' in temps[id]) ?
      temps[id]['iio.in_temp_input'] : null

    const temp = nodeTemps ? nodeTemps[nodeTemps.length-1].value / 1000 : -999

    return {
      ...nodeObj,
      vsn,
      temp,
      status: determineStatus(elaspedTimes),
      elaspedTimes,
      lat: getMetric(metrics, id, 'sys.gps.lat').nx,
      lng: getMetric(metrics, id, 'sys.gps.lon').nx,
      alt: getMetric(metrics, id, 'sys.gps.alt').nx,
      uptimes: getMetric(metrics, id, 'sys.uptime'),
      sysTimes: getMetric(metrics, id, 'sys.time'),
      cpu: getMetric(metrics, id, 'sys.cpu_seconds', false),
      memTotal: getMetric(metrics, id, 'sys.mem.total'),
      memFree: getMetric(metrics, id, 'sys.mem.free'),
      memAvail: getMetric(metrics, id, 'sys.mem.avail'),
      fsAvail: getMetric(metrics, id, 'sys.fs.avail', false),
      fsSize: getMetric(metrics, id, 'sys.fs.size', false),
      txBytes: getMetric(metrics, id, 'sys.net.tx_bytes', false),
      txPackets: getMetric(metrics, id, 'sys.net.tx_packets', false),
      rxBytes: getMetric(metrics, id, 'sys.net.rx_bytes', false),
      rxPackets: getMetric(metrics, id, 'sys.net.rx_packets', false),
      ip: getMetric(metrics, id, 'sys.net.ip', false)?.nx?.filter(o => o.meta.device == 'wan0')[0].value,
      health: {
        oldSanity: getSanity(metrics, id),
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
  location: []
}


export function getFilterState(params) {
  let init = {...initialState}
  for (const [key, val] of params) {
    if (['query'].includes(key)) continue
    init[key] = val.split(',')
  }

  return init
}

