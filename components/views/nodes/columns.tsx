/* eslint-disable react/display-name */
import settings from '/components/settings'
import * as formatters from '/components/views/nodes/nodeFormatters'
import type { Column } from '/components/table/Table'
import { phaseMap, type Node } from '/components/apis/beekeeper'

export { accessFormatter } from '/components/views/nodes/nodeFormatters'


const PROJECT = settings.project?.toLowerCase()

const STATUS_PHASE_KEY_ORDER = Object.keys(phaseMap) as Array<keyof typeof phaseMap>
const STATUS_PHASE_INDEX = new Map<string, number>()

const normalizePhase = (value: unknown) =>
  String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')

const getVsnLast3HexValue = (vsn: string) => {
  const tail = String(vsn || '').slice(-3)
  const parsed = Number.parseInt(tail, 16)
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed
}

const VSN_PREFIX_ORDER = new Map<string, number>([
  ['H', 0],
  ['W', 1],
  ['V', 2],
  ['T', 3]
])

const getVsnPrefixRank = (vsn: string) => {
  const prefix = String(vsn || '').charAt(0).toUpperCase()
  return VSN_PREFIX_ORDER.get(prefix) ?? Number.MAX_SAFE_INTEGER
}

const sortByCount = (aCount: number, bCount: number, direction: 'asc' | 'dsc') =>
  direction == 'asc' ? aCount - bCount : bCount - aCount

const getUniqueSensorCapabilityCount = (node: Node) => {
  const caps = new Set<string>()
  node.sensors?.forEach(sensor => sensor.capabilities?.forEach(cap => caps.add(cap)))
  return caps.size
}

STATUS_PHASE_KEY_ORDER.forEach((phaseKey, idx) => {
  STATUS_PHASE_INDEX.set(normalizePhase(phaseKey), idx)
  STATUS_PHASE_INDEX.set(normalizePhase(phaseMap[phaseKey]), idx)
})

const columns: Column<Node>[] = [{
  id: 'status',
  label: 'Status',
  format: formatters.statusWithPhase,
  sort: (a, b, direction) => {
    const aIdx = STATUS_PHASE_INDEX.get(normalizePhase(a.phase)) ?? Number.MAX_SAFE_INTEGER
    const bIdx = STATUS_PHASE_INDEX.get(normalizePhase(b.phase)) ?? Number.MAX_SAFE_INTEGER

    if (aIdx !== bIdx) {
      return direction == 'asc' ? aIdx - bIdx : bIdx - aIdx
    }

    // Within deployed/awaiting nodes, prioritize reporting status.
    const aPhase = normalizePhase(a.phase)
    const bPhase = normalizePhase(b.phase)
    const isDeployedOrAwaiting = (phase: string) =>
      phase === 'deployed' || phase === 'awaiting deployment'

    if (isDeployedOrAwaiting(aPhase) && isDeployedOrAwaiting(bPhase)) {
      const aStatus = normalizePhase((a as Node & {status?: string}).status)
      const bStatus = normalizePhase((b as Node & {status?: string}).status)
      const aReportingIdx = aStatus === 'reporting' ? 0 : 1
      const bReportingIdx = bStatus === 'reporting' ? 0 : 1

      if (aReportingIdx !== bReportingIdx) {
        return direction == 'asc' ?
          aReportingIdx - bReportingIdx :
          bReportingIdx - aReportingIdx
      }
    }

    return direction == 'asc' ?
      a.vsn.localeCompare(b.vsn) :
      b.vsn.localeCompare(a.vsn)
  },
  width: '1px'
}, {
  id: 'vsn',
  label: 'Node',
  format: formatters.vsnLinkWithEdit, // vsnLinkWithEdit is used if permissions are found,
  sort: (a, b, direction) => {
    const aPrefixRank = getVsnPrefixRank(a.vsn)
    const bPrefixRank = getVsnPrefixRank(b.vsn)

    if (aPrefixRank !== bPrefixRank) {
      return direction == 'asc' ? aPrefixRank - bPrefixRank : bPrefixRank - aPrefixRank
    }

    const aHex = getVsnLast3HexValue(a.vsn)
    const bHex = getVsnLast3HexValue(b.vsn)

    if (aHex !== bHex) {
      return direction == 'asc' ? aHex - bHex : bHex - aHex
    }

    return direction == 'asc' ?
      a.vsn.localeCompare(b.vsn) :
      b.vsn.localeCompare(a.vsn)
  },
  width: '138px'
}, {
  id: 'type',
  label: 'Type',
  hide: PROJECT != 'sage'
}, {
  id: 'focus',
  label: 'Focus',
  format: formatters.focus
}, {
  id: 'elapsedTimes',
  label: 'Last Reported Metrics',
  format: formatters.lastUpdated,
  hide: true
}, {
  id: 'uptimes',
  label: 'Uptime',
  format: formatters.uptimes,
  hide: true
}, {
  id: 'city',
  label: 'City',
  hide: true
}, {
  id: 'state',
  label: 'State',
  format: (val, obj) =>
    <div className="flex items-center">
      <formatters.GPSIcon obj={obj} />&nbsp;
      {val || '-'}
    </div>
}, {
  id: 'gps',
  label: 'GPS',
  format: formatters.gps,
  dlFormat: (_, obj) => (obj.lat && obj.lng) ? `${obj.lat}, ${obj.lng}` : '',
  hide: true
}, {
  id: 'alt',
  label: 'Elevation (m)',
  format: (val) => {
    return val || '-'
  },
  hide: true
}, {
  id: 'sensors',
  label: 'Sensors',
  format: (val) => <formatters.HardwareList data={val} path="/sensors/" />,
  initialSortDirection: 'dsc',
  sort: (a, b, direction) =>
    sortByCount(a.sensors?.length || 0, b.sensors?.length || 0, direction),
  dlFormat: (val) => val.map(v => v.hw_model).join(', '),
  hide: true
}, {
  id: 'sensorIcons',
  label: 'Sensor Capabilities',
  format: (_, obj) => <formatters.SensorIcons data={obj.sensors} />,
  initialSortDirection: 'dsc',
  sort: (a, b, direction) =>
    sortByCount(getUniqueSensorCapabilityCount(a), getUniqueSensorCapabilityCount(b), direction),
  dlFormat: (_, obj) => {
    const caps = new Set()
    obj.sensors?.forEach(s => s.capabilities?.forEach(c => caps.add(c)))
    return Array.from(caps).sort().join(', ')
  }
}, {
  id: 'sensorModels',
  label: 'Sensor Models',
  format: (_, obj) => <formatters.HardwareListSimple data={obj.sensors} path="/sensors/" />,
  initialSortDirection: 'dsc',
  sort: (a, b, direction) =>
    sortByCount(a.sensors?.length || 0, b.sensors?.length || 0, direction),
  dlFormat: (_, obj) => obj.sensors.map(v => v.hw_model).join(', '),
  hide: true
},{
  id: 'sensorCapabilities',
  label: 'Sensor Capabilities',
  format: (val) => val.join(', '),
  initialSortDirection: 'dsc',
  sort: (a, b, direction) => {
    const aCaps = (a as Node & {sensorCapabilities?: string[]}).sensorCapabilities
    const bCaps = (b as Node & {sensorCapabilities?: string[]}).sensorCapabilities
    return sortByCount(aCaps?.length || 0, bCaps?.length || 0, direction)
  },
  dlFormat: (val) => val.join(', '),
  hide: true
}, {
  id: 'computes',
  label: 'Computes',
  format: (val) => <formatters.HardwareList data={val} />,
  initialSortDirection: 'dsc',
  sort: (a, b, direction) =>
    sortByCount(a.computes?.length || 0, b.computes?.length || 0, direction),
  dlFormat: (val) => val.map(v => v.hw_model).join(', '),
  width: '200px',
  hide: true
}, {
  id: 'commissioned_at',
  label: 'Commission Time',
  hide: true,
  format: (val) => val ? new Date(val).toLocaleString() : '-'
}, {
  id: 'modem_model',
  label: 'Modem',
  format: formatters.modem,
  hide: true
}, {
  id: 'modem_sim',
  label: 'Modem Sim',
  format: formatters.modemSim,
  hide: true
}]


if (PROJECT != 'sage') {
  columns.splice(4, 0, {
    id: 'phase',
    label: 'Phase',
    hide: true
  })
}

export default columns


