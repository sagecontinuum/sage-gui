import * as BK from '/components/apis/beekeeper'

export type TimelineEntry = {
  timestamp: string
  name: string
  end?: string
  value: number | string
  meta: {
    state: 'up' | 'down'
    instance?: string
    partner?: string
  }
}

export type TimelineData = Record<string, TimelineEntry[]>

export type FilterOption = {
  id: string
  label?: unknown
}

export type PrometheusMatrixResult = {
  metric: {
    instance?: string
    sage_name?: string
  }
  values: [number, string][]
}

export type PrometheusResponse = {
  status: 'success' | 'error'
  error?: string
  data?: {
    resultType: 'matrix'
    result: PrometheusMatrixResult[]
  }
}

export type RowInfo = {
  vsn: string
  siteId: string
  phase: BK.Phase
  partner: string
}

export type LabelFieldId = 'site_id' | 'phase' | 'partner' | 'vsn'

export type SortOptionId = 'none' | 'site_id' | 'phase' | 'partner' | 'vsn' | 'up_down'

export type PhaseFilterOption = BK.Phase | 'All'

export type LabelFieldOption = {
  id: LabelFieldId
  label: string
}

export type SortOption = {
  id: SortOptionId
  label: string
}

export type SortDirection = 'asc' | 'desc'

export const LABEL_FIELD_OPTIONS: LabelFieldOption[] = [
  { id: 'phase', label: 'Phase' },
  { id: 'partner', label: 'Partner' },
  { id: 'site_id', label: 'Site ID' },
  { id: 'vsn', label: 'VSN' },
]

export const DEFAULT_LABEL_FIELDS: LabelFieldId[] = ['site_id', 'vsn', 'partner']

export const SORT_OPTIONS: SortOption[] = [
  { id: 'none', label: 'None' },
  { id: 'site_id', label: 'Site ID' },
  { id: 'phase', label: 'Phase' },
  { id: 'partner', label: 'Partner' },
  { id: 'vsn', label: 'VSN' },
  { id: 'up_down', label: 'Up/Down (last hour)' }
]

export const PHASE_OPTIONS: PhaseFilterOption[] = ['All', ...Object.values(BK.phaseMap)]

export const DEFAULT_PHASE_FILTER: PhaseFilterOption = 'Deployed'
export const DEFAULT_SORT_OPTION = SORT_OPTIONS[0]
export const DEFAULT_SORT_DIRECTION: SortDirection = 'asc'

export const PROMETHEUS_QUERY = 'up{sage_name=~"node-.*"}'
export const PROMETHEUS_URL = 'https://vpn-prometheus.sagecontinuum.org/api/v1/query_range'
export const DEFAULT_DAYS = 7
export const DEFAULT_STEP_SECONDS = 15
export const MAX_POINTS_PER_SERIES = 11000
export const TIMELINE_CELL_HEIGHT_PX = 24
