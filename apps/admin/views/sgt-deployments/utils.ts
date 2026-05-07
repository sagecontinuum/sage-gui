import * as BK from '/components/apis/beekeeper'
import {
  DEFAULT_LABEL_FIELDS,
  DEFAULT_PHASE_FILTER,
  DEFAULT_SORT_OPTION,
  DEFAULT_STEP_SECONDS,
  LABEL_FIELD_OPTIONS,
  MAX_POINTS_PER_SERIES,
  PHASE_OPTIONS,
  PROMETHEUS_QUERY,
  PROMETHEUS_URL,
  SORT_OPTIONS,
  type LabelFieldId,
  type PhaseFilterOption,
  type PrometheusMatrixResult,
  type RowInfo,
  type SortDirection,
  type SortOption,
  type TimelineData,
  type TimelineEntry,
} from './types'

export function parseSortOption(value: string | null): SortOption {
  return SORT_OPTIONS.find((option) => option.id == value) || DEFAULT_SORT_OPTION
}

export function parseSortDirection(value: string | null): SortDirection {
  return value == 'desc' ? 'desc' : 'asc'
}

export function parsePhaseFilter(value: string | null): PhaseFilterOption {
  return PHASE_OPTIONS.find((option) => option == value) || DEFAULT_PHASE_FILTER
}

export function parseLabelFields(value: string | null): LabelFieldId[] {
  const next = (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is LabelFieldId => LABEL_FIELD_OPTIONS.some((option) => option.id == item))

  return next.length > 0 ? next : DEFAULT_LABEL_FIELDS
}

export function parseSelectedPartners(value: string | null): string[] {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function getRowLabel(rowInfo: RowInfo, fields: LabelFieldId[]): string {
  const labelParts = fields.map((field) => {
    if (field == 'site_id') return rowInfo.siteId
    if (field == 'phase') return rowInfo.phase
    if (field == 'partner') return rowInfo.partner
    return rowInfo.vsn
  }).filter(Boolean)

  return labelParts.join(' | ') || rowInfo.vsn
}

export function getLastHourState(entries: TimelineEntry[], endTime: Date): 'up' | 'down' {
  const lastHourStart = endTime.getTime() - (60 * 60 * 1000)

  return entries.some((entry) => {
    const entryStart = new Date(entry.timestamp).getTime()
    const entryEnd = entry.end ? new Date(entry.end).getTime() : endTime.getTime()
    return entryEnd > lastHourStart && entryStart < endTime.getTime() && entry.meta.state == 'down'
  })
    ? 'down'
    : 'up'
}

export function getLastHourDowntimeMs(entries: TimelineEntry[], endTime: Date): number {
  const lastHourStart = endTime.getTime() - (60 * 60 * 1000)

  return entries.reduce((downtimeMs, entry) => {
    if (entry.meta.state != 'down') return downtimeMs

    const entryStart = new Date(entry.timestamp).getTime()
    const entryEnd = entry.end ? new Date(entry.end).getTime() : endTime.getTime()
    const overlapStart = Math.max(entryStart, lastHourStart)
    const overlapEnd = Math.min(entryEnd, endTime.getTime())

    if (overlapEnd <= overlapStart) return downtimeMs

    return downtimeMs + (overlapEnd - overlapStart)
  }, 0)
}

export function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: 'base' })
}

export function toStatusIntervals(values: [number, string][], stepSeconds: number) {
  if (!values.length) return []

  const intervals: Array<{ start: number, end: number, value: number }> = []

  let runStart = values[0][0]
  let runValue = Number(values[0][1]) > 0 ? 1 : 0
  let prevTimestamp = values[0][0]

  for (let i = 1; i < values.length; i++) {
    const [timestamp, rawValue] = values[i]
    const numeric = Number(rawValue) > 0 ? 1 : 0

    if (numeric != runValue) {
      intervals.push({
        start: runStart,
        end: prevTimestamp + stepSeconds,
        value: runValue
      })

      runStart = timestamp
      runValue = numeric
    }

    prevTimestamp = timestamp
  }

  intervals.push({
    start: runStart,
    end: prevTimestamp + stepSeconds,
    value: runValue
  })

  return intervals
}

export function getQueryStepSeconds(start: Date, end: Date): number {
  const rangeSeconds = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 1000))
  const minStepForLimit = Math.ceil(rangeSeconds / MAX_POINTS_PER_SERIES)
  return Math.max(DEFAULT_STEP_SECONDS, minStepForLimit)
}

export function getPrometheusURL(start: Date, end: Date, stepSeconds: number): string {
  const params = new URLSearchParams({
    query: PROMETHEUS_QUERY,
    start: String(Math.floor(start.getTime() / 1000)),
    end: String(Math.floor(end.getTime() / 1000)),
    step: `${stepSeconds}s`
  })

  return `${PROMETHEUS_URL}?${params.toString()}`
}

export function toTimelineData(
  deployedNodes: BK.Node[],
  series: PrometheusMatrixResult[],
  stepSeconds: number
): TimelineData {
  const deployedVSNs = new Set(deployedNodes.map((node) => node.vsn))
  const partnerByVSN = new Map(deployedNodes.map((node) => [node.vsn, node.partner]))

  return series.reduce<TimelineData>((acc, item) => {
    const sageName = item.metric.sage_name
    const vsn = sageName?.replace(/^node-/, '')

    if (!vsn || !deployedVSNs.has(vsn as BK.VSN)) {
      return acc
    }

    const rowKey = vsn

    acc[rowKey] = toStatusIntervals(item.values, stepSeconds).map((interval) => {
      const numericValue = interval.value
      return {
        timestamp: new Date(interval.start * 1000).toISOString(),
        name: rowKey,
        end: new Date(interval.end * 1000).toISOString(),
        value: numericValue,
        meta: {
          state: numericValue > 0 ? 'up' : 'down',
          instance: item.metric.instance,
          partner: partnerByVSN.get(vsn as BK.VSN) || ''
        }
      }
    })

    return acc
  }, {})
}
