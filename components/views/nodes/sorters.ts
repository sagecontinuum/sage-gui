import { phaseMap, type Node } from '/components/apis/beekeeper'

type SortDirection = 'asc' | 'dsc'
type SortableNode = Node & Partial<{
  status: string
  sensorCapabilities: string[]
  city: string
  state: string
  elapsedTimes: Record<string, unknown>
  uptimes: Record<string, unknown>
  alt: number
}>

const STATUS_PHASE_KEY_ORDER = Object.keys(phaseMap) as Array<keyof typeof phaseMap>

const normalizePhase = (value: unknown) =>
  String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')

const buildStatusPhaseIndex = () => {
  const index = new Map<string, number>()
  STATUS_PHASE_KEY_ORDER.forEach((phaseKey, idx) => {
    index.set(normalizePhase(phaseKey), idx)
    index.set(normalizePhase(phaseMap[phaseKey]), idx)
  })
  return index
}

const STATUS_PHASE_INDEX = buildStatusPhaseIndex()

const sortByCount = (aCount: number, bCount: number, direction: SortDirection) =>
  direction === 'asc' ? aCount - bCount : bCount - aCount

const sortText = (aText: string, bText: string, direction: SortDirection) =>
  direction === 'asc' ?
    aText.localeCompare(bText) :
    bText.localeCompare(aText)

const sortByTextField = (
  a: SortableNode,
  b: SortableNode,
  direction: SortDirection,
  field: keyof SortableNode
) => sortText(String(a[field] || ''), String(b[field] || ''), direction)

const toNumberOrInfinity = (value: unknown) => {
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : Number.POSITIVE_INFINITY
}

const getMetricMapAggregate = (
  value: unknown,
  aggregate: 'min' | 'max' = 'max'
) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return Number.POSITIVE_INFINITY
  }

  const nums = Object.values(value)
    .map(toNumberOrInfinity)
    .filter(Number.isFinite)

  if (!nums.length) {
    return Number.POSITIVE_INFINITY
  }

  return aggregate === 'min' ? Math.min(...nums) : Math.max(...nums)
}

const getUniqueSensorCapabilityCount = (node: Node) => {
  const caps = new Set<string>()
  node.sensors?.forEach(sensor => sensor.capabilities?.forEach(cap => caps.add(cap)))
  return caps.size
}

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

export const sortStatus = (a: Node, b: Node, direction: SortDirection) => {
  const aIdx = STATUS_PHASE_INDEX.get(normalizePhase(a.phase)) ?? Number.MAX_SAFE_INTEGER
  const bIdx = STATUS_PHASE_INDEX.get(normalizePhase(b.phase)) ?? Number.MAX_SAFE_INTEGER

  if (aIdx !== bIdx) {
    return direction === 'asc' ? aIdx - bIdx : bIdx - aIdx
  }

  const aPhase = normalizePhase(a.phase)
  const bPhase = normalizePhase(b.phase)
  const isDeployedOrAwaiting = (phase: string) =>
    phase === 'deployed' || phase === 'awaiting deployment'

  if (isDeployedOrAwaiting(aPhase) && isDeployedOrAwaiting(bPhase)) {
    const aStatus = normalizePhase((a as SortableNode).status)
    const bStatus = normalizePhase((b as SortableNode).status)
    const aReportingIdx = aStatus === 'reporting' ? 0 : 1
    const bReportingIdx = bStatus === 'reporting' ? 0 : 1

    if (aReportingIdx !== bReportingIdx) {
      return direction === 'asc' ?
        aReportingIdx - bReportingIdx :
        bReportingIdx - aReportingIdx
    }
  }

  return direction === 'asc' ?
    a.vsn.localeCompare(b.vsn) :
    b.vsn.localeCompare(a.vsn)
}

export const sortVsn = (a: Node, b: Node, direction: SortDirection) => {
  const aPrefixRank = getVsnPrefixRank(a.vsn)
  const bPrefixRank = getVsnPrefixRank(b.vsn)

  if (aPrefixRank !== bPrefixRank) {
    return direction === 'asc' ? aPrefixRank - bPrefixRank : bPrefixRank - aPrefixRank
  }

  const aHex = getVsnLast3HexValue(a.vsn)
  const bHex = getVsnLast3HexValue(b.vsn)

  if (aHex !== bHex) {
    return direction === 'asc' ? aHex - bHex : bHex - aHex
  }

  return direction === 'asc' ?
    a.vsn.localeCompare(b.vsn) :
    b.vsn.localeCompare(a.vsn)
}

export const sortBySensorCount = (a: Node, b: Node, direction: SortDirection) =>
  sortByCount(a.sensors?.length || 0, b.sensors?.length || 0, direction)

export const sortByUniqueSensorCapabilityCount = (a: Node, b: Node, direction: SortDirection) =>
  sortByCount(getUniqueSensorCapabilityCount(a), getUniqueSensorCapabilityCount(b), direction)

export const sortBySensorCapabilitiesCount = (a: Node, b: Node, direction: SortDirection) => {
  const aCaps = (a as SortableNode).sensorCapabilities
  const bCaps = (b as SortableNode).sensorCapabilities
  return sortByCount(aCaps?.length || 0, bCaps?.length || 0, direction)
}

export const sortByComputeCount = (a: Node, b: Node, direction: SortDirection) =>
  sortByCount(a.computes?.length || 0, b.computes?.length || 0, direction)

export const sortType = (a: SortableNode, b: SortableNode, direction: SortDirection) =>
  sortByTextField(a, b, direction, 'type')

export const sortFocus = (a: SortableNode, b: SortableNode, direction: SortDirection) => {
  const focusSort = sortByTextField(a, b, direction, 'focus')
  if (focusSort !== 0) {
    return focusSort
  }

  const partnerSort = sortText(String(a.partner || ''), String(b.partner || ''), direction)
  if (partnerSort !== 0) {
    return partnerSort
  }

  return sortText(String(a.vsn || ''), String(b.vsn || ''), direction)
}

export const sortCity = (a: SortableNode, b: SortableNode, direction: SortDirection) =>
  sortByTextField(a, b, direction, 'city')

export const sortState = (a: SortableNode, b: SortableNode, direction: SortDirection) =>
  sortByTextField(a, b, direction, 'state')

export const sortElapsedTimes = (a: SortableNode, b: SortableNode, direction: SortDirection) => {
  const aElapsed = getMetricMapAggregate(a.elapsedTimes, 'max')
  const bElapsed = getMetricMapAggregate(b.elapsedTimes, 'max')
  return sortByCount(aElapsed, bElapsed, direction)
}

export const sortUptimes = (a: SortableNode, b: SortableNode, direction: SortDirection) => {
  const aUptime = getMetricMapAggregate(a.uptimes, 'min')
  const bUptime = getMetricMapAggregate(b.uptimes, 'min')
  return sortByCount(aUptime, bUptime, direction)
}

export const sortGps = (a: SortableNode, b: SortableNode, direction: SortDirection) => {
  const aHasCoords = Number(Boolean(a.lat) && Boolean(a.lng))
  const bHasCoords = Number(Boolean(b.lat) && Boolean(b.lng))

  if (aHasCoords !== bHasCoords) {
    return direction === 'asc' ? aHasCoords - bHasCoords : bHasCoords - aHasCoords
  }

  const aLat = toNumberOrInfinity(a.lat)
  const bLat = toNumberOrInfinity(b.lat)
  if (aLat !== bLat) {
    return sortByCount(aLat, bLat, direction)
  }

  const aLng = toNumberOrInfinity(a.lng)
  const bLng = toNumberOrInfinity(b.lng)
  return sortByCount(aLng, bLng, direction)
}

export const sortAlt = (a: SortableNode, b: SortableNode, direction: SortDirection) =>
  sortByCount(toNumberOrInfinity(a.alt), toNumberOrInfinity(b.alt), direction)

export const sortCommissionedAt = (a: SortableNode, b: SortableNode, direction: SortDirection) => {
  const aTime = Date.parse(String(a.commissioned_at || ''))
  const bTime = Date.parse(String(b.commissioned_at || ''))
  const aValue = Number.isFinite(aTime) ? aTime : Number.POSITIVE_INFINITY
  const bValue = Number.isFinite(bTime) ? bTime : Number.POSITIVE_INFINITY
  return sortByCount(aValue, bValue, direction)
}

export const sortModemModel = (a: SortableNode, b: SortableNode, direction: SortDirection) =>
  sortByTextField(a, b, direction, 'modem_model')

export const sortModemSim = (a: SortableNode, b: SortableNode, direction: SortDirection) =>
  sortByTextField(a, b, direction, 'modem_sim')
