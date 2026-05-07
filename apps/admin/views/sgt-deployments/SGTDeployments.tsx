import { type MouseEvent as ReactMouseEvent, useEffect, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Button from '@mui/material/Button'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { subDays } from 'date-fns'
import { useSearchParams } from 'react-router-dom'

import * as BK from '/components/apis/beekeeper'
import config from '/config'
import FilterMenu from '/components/FilterMenu'
import TimelineChart, { color, type TimelineProps } from '/components/viz/Timeline'
import { Replay } from '@mui/icons-material'

import NodeContextMenu from './NodeContextMenu'
import { NodeLabelTrigger, renderRowLabel } from './NodeLabelTrigger'
import SortStrip from './SortStrip'
import {
  DEFAULT_DAYS,
  DEFAULT_LABEL_FIELDS,
  DEFAULT_PHASE_FILTER,
  DEFAULT_SORT_DIRECTION,
  DEFAULT_SORT_OPTION,
  DEFAULT_STEP_SECONDS,
  LABEL_FIELD_OPTIONS,
  PHASE_OPTIONS,
  SORT_OPTIONS,
  TIMELINE_CELL_HEIGHT_PX,
  type FilterOption,
  type LabelFieldId,
  type LabelFieldOption,
  type PhaseFilterOption,
  type PrometheusResponse,
  type RowInfo,
  type SortDirection,
  type SortOption,
  type SortOptionId,
  type TimelineData,
} from './types'
import {
  compareStrings,
  getLastHourDowntimeMs,
  getLastHourState,
  getPrometheusURL,
  getQueryStepSeconds,
  getRowLabel,
  parseLabelFields,
  parsePhaseFilter,
  parseSelectedPartners,
  parseSortDirection,
  parseSortOption,
  toTimelineData,
} from './utils'

type TimelineCellClickItem = Parameters<NonNullable<TimelineProps['onCellClick']>>[0]
type TimelineCellClickEvent = Parameters<NonNullable<TimelineProps['onCellClick']>>[1]

export default function SGTDeployments() {
  const [params, setParams] = useSearchParams()
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null)
  const [sgtNodes, setSgtNodes] = useState<BK.Node[]>([])
  const [selectedPartners, setSelectedPartners] = useState<string[]>(
    () => parseSelectedPartners(params.get('partners'))
  )
  const [selectedPhase, setSelectedPhase] = useState<PhaseFilterOption>(() => parsePhaseFilter(params.get('phase')))
  const [labelFields, setLabelFields] = useState<LabelFieldId[]>(() => parseLabelFields(params.get('labels')))
  const [sortBy, setSortBy] = useState<SortOption>(() => parseSortOption(params.get('sort')))
  const [sortDirection, setSortDirection] = useState<SortDirection>(() => parseSortDirection(params.get('sort_dir')))
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [queryStepSeconds, setQueryStepSeconds] = useState<number>(DEFAULT_STEP_SECONDS)
  const [menuRowKey, setMenuRowKey] = useState<string | null>(null)
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null)
  const [menuAnchorPosition, setMenuAnchorPosition] = useState<{ top: number, left: number } | null>(null)

  const startTime = useMemo(() => subDays(new Date(), DEFAULT_DAYS), [])
  const endTime = useMemo(() => new Date(), [])

  useEffect(() => {
    const nextPhase = parsePhaseFilter(params.get('phase'))
    const nextPartners = parseSelectedPartners(params.get('partners'))
    const nextLabelFields = parseLabelFields(params.get('labels'))
    const nextSort = parseSortOption(params.get('sort'))
    const nextSortDirection = parseSortDirection(params.get('sort_dir'))

    setSelectedPhase((current) => current == nextPhase ? current : nextPhase)
    setSelectedPartners((current) => current.join(',') == nextPartners.join(',') ? current : nextPartners)
    setLabelFields((current) => current.join(',') == nextLabelFields.join(',') ? current : nextLabelFields)
    setSortBy((current) => current.id == nextSort.id ? current : nextSort)
    setSortDirection((current) => current == nextSortDirection ? current : nextSortDirection)
  }, [params])

  useEffect(() => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)

      if (selectedPhase != DEFAULT_PHASE_FILTER) next.set('phase', selectedPhase)
      else next.delete('phase')

      if (selectedPartners.length > 0) next.set('partners', selectedPartners.join(','))
      else next.delete('partners')

      if (labelFields.join(',') != DEFAULT_LABEL_FIELDS.join(',')) next.set('labels', labelFields.join(','))
      else next.delete('labels')

      if (sortBy.id != DEFAULT_SORT_OPTION.id) next.set('sort', sortBy.id)
      else next.delete('sort')

      if (sortBy.id != 'none' && sortDirection != DEFAULT_SORT_DIRECTION) next.set('sort_dir', sortDirection)
      else next.delete('sort_dir')

      return next.toString() == prev.toString() ? prev : next
    })
  }, [labelFields, selectedPartners, selectedPhase, setParams, sortBy.id, sortDirection])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const stepSeconds = getQueryStepSeconds(startTime, endTime)
        const sgtNodes = await BK.getNodes({project: 'SGT'})

        const response = await fetch(getPrometheusURL(startTime, endTime, stepSeconds))
        const payload = await response.json() as PrometheusResponse

        if (!response.ok || payload.status != 'success' || !payload.data) {
          throw new Error(payload.error || 'Failed to load Prometheus uptime data')
        }

        const nextData = toTimelineData(sgtNodes, payload.data.result, stepSeconds)

        if (!cancelled) {
          setSgtNodes(sgtNodes)
          setQueryStepSeconds(stepSeconds)
          setTimelineData(nextData)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load SGT deployment data')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [endTime, startTime])

  const phaseNodes = useMemo(() => {
    if (selectedPhase == 'All') return sgtNodes

    return sgtNodes.filter((node) => node.phase == selectedPhase)
  }, [selectedPhase, sgtNodes])

  const partnerOptions = useMemo(() => {
    return [...new Set(phaseNodes.map((node) => node.partner).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .map((partner) => ({ id: partner, label: partner })) as FilterOption[]
  }, [phaseNodes])

  const handlePhaseChange = (_event: ReactMouseEvent<HTMLElement>, nextPhase: PhaseFilterOption | null) => {
    if (!nextPhase) return

    setSelectedPhase(nextPhase)
    setSelectedPartners([])
  }

  const handlePartnerFilterChange = (items: (string | FilterOption)[]) => {
    const next = items
      .map((item) => typeof item == 'string' ? item : item.id)
      .filter(Boolean)

    setSelectedPartners(next)
  }

  const handleLabelFieldsChange = (items: (string | LabelFieldOption)[]) => {
    const next = items
      .map((item) => typeof item == 'string' ? item : item.id)
      .filter(Boolean) as LabelFieldId[]

    setLabelFields(next.length > 0 ? next : DEFAULT_LABEL_FIELDS)
  }

  const rowInfoByKey = useMemo(() => {
    return phaseNodes.reduce<Record<string, RowInfo>>((acc, node) => {
      acc[node.vsn] = {
        vsn: node.vsn,
        siteId: node.site_id || '',
        phase: node.phase,
        partner: node.partner || ''
      }
      return acc
    }, {})
  }, [phaseNodes])

  const displayLabelByKey = useMemo(() => {
    return Object.entries(rowInfoByKey).reduce<Record<string, string>>((acc, [rowKey, rowInfo]) => {
      acc[rowKey] = getRowLabel(rowInfo, labelFields)
      return acc
    }, {})
  }, [labelFields, rowInfoByKey])

  const deployedNodeOrder = useMemo(() => {
    return new Map<string, number>(phaseNodes.map((node, index) => [node.vsn, index]))
  }, [phaseNodes])

  const handleSortWithDirection = (sortId: SortOptionId, direction: SortDirection) => {
    const next = SORT_OPTIONS.find((option) => option.id == sortId)
    if (!next) return

    setSortBy(next)
    setSortDirection(direction)
  }

  const handleClearControls = () => {
    setSelectedPhase(DEFAULT_PHASE_FILTER)
    setSelectedPartners([])
    setLabelFields(DEFAULT_LABEL_FIELDS)
    setSortBy(DEFAULT_SORT_OPTION)
    setSortDirection(DEFAULT_SORT_DIRECTION)
  }

  const hasActiveControls =
    selectedPhase != DEFAULT_PHASE_FILTER ||
    selectedPartners.length > 0 ||
    labelFields.join(',') != DEFAULT_LABEL_FIELDS.join(',') ||
    sortBy.id != DEFAULT_SORT_OPTION.id ||
    sortDirection != DEFAULT_SORT_DIRECTION

  const filteredTimelineData = useMemo(() => {
    if (!timelineData) return null

    const selected = new Set(selectedPartners)

    const filteredEntries = Object.entries(timelineData)
      .filter(([rowKey, entries]) => {
        if (!rowInfoByKey[rowKey]) return false
        if (selected.size == 0) return true
        return selected.has(entries[0]?.meta?.partner || rowInfoByKey[rowKey]?.partner || '')
      })
      .sort(([rowKeyA, entriesA], [rowKeyB, entriesB]) => {
        const rowA = rowInfoByKey[rowKeyA] || { vsn: '', siteId: '', phase: 'Deployed', partner: '' }
        const rowB = rowInfoByKey[rowKeyB] || { vsn: '', siteId: '', phase: 'Deployed', partner: '' }
        const labelA = displayLabelByKey[rowKeyA] || rowKeyA
        const labelB = displayLabelByKey[rowKeyB] || rowKeyB
        const directionFactor = sortDirection == 'desc' ? -1 : 1

        if (sortBy.id == 'none') {
          return (deployedNodeOrder.get(rowKeyA) ?? Number.MAX_SAFE_INTEGER) -
            (deployedNodeOrder.get(rowKeyB) ?? Number.MAX_SAFE_INTEGER)
        }

        if (sortBy.id == 'up_down') {
          const stateA = getLastHourState(entriesA, endTime)
          const stateB = getLastHourState(entriesB, endTime)

          if (stateA != stateB) {
            return (stateA == 'down' ? -1 : 1) * directionFactor
          }

          const downtimeA = getLastHourDowntimeMs(entriesA, endTime)
          const downtimeB = getLastHourDowntimeMs(entriesB, endTime)

          if (downtimeA != downtimeB) {
            return (downtimeB - downtimeA) * directionFactor
          }

          return compareStrings(labelA, labelB) * directionFactor
        }

        if (sortBy.id == 'site_id') {
          const bySiteId = compareStrings(rowA.siteId, rowB.siteId)
          if (bySiteId != 0) return bySiteId * directionFactor
          return compareStrings(rowA.vsn, rowB.vsn) * directionFactor
        }

        if (sortBy.id == 'phase') {
          const byPhase = compareStrings(rowA.phase, rowB.phase)
          if (byPhase != 0) return byPhase * directionFactor
          return compareStrings(rowA.vsn, rowB.vsn) * directionFactor
        }

        if (sortBy.id == 'partner') {
          const byPartner = compareStrings(rowA.partner, rowB.partner)
          if (byPartner != 0) return byPartner * directionFactor
          return compareStrings(rowA.vsn, rowB.vsn) * directionFactor
        }

        return compareStrings(rowA.vsn, rowB.vsn) * directionFactor
      })

    return filteredEntries.reduce<TimelineData>((acc, [rowKey, entries]) => {
      acc[rowKey] = entries
      return acc
    }, {})
  }, [
    deployedNodeOrder,
    displayLabelByKey,
    endTime,
    rowInfoByKey,
    selectedPartners,
    sortBy.id,
    sortDirection,
    timelineData
  ])

  const rowCount = filteredTimelineData ? Object.keys(filteredTimelineData).length : 0
  const menuRowInfo = menuRowKey ? rowInfoByKey[menuRowKey] : null
  const menuLabel = menuRowInfo
    ? [menuRowInfo.partner, menuRowInfo.siteId, menuRowInfo.vsn].filter(Boolean).join(' | ') || null
    : (menuRowKey ? displayLabelByKey[menuRowKey] || menuRowKey : null)
  const portalNodeUrl = menuRowInfo && config.portal
    ? `${config.portal}/nodes/${menuRowInfo.vsn}`
    : undefined
  const grafanaUrl = menuRowInfo
    ? 'https://grafana.sagecontinuum.org/d/adk6gvg/node-status?' +
      'orgId=1&from=now-6h&to=now&timezone=browser&var-job=nodes' +
      `&var-sage_name=${encodeURIComponent(`node-${menuRowInfo.vsn}`)}`
    : ''

  const handleOpenMenuFromLabel = (rowKey: string, event: ReactMouseEvent<HTMLElement>) => {
    setMenuRowKey(rowKey)
    setMenuAnchorEl(event.currentTarget)
    setMenuAnchorPosition(null)
  }

  const handleOpenMenuFromCell = (item: TimelineCellClickItem, evt?: TimelineCellClickEvent) => {
    const rowKey = item?.row as string
    if (!rowKey) return

    setMenuRowKey(rowKey)
    setMenuAnchorEl(null)
    if (evt) {
      setMenuAnchorPosition({ top: evt.clientY, left: evt.clientX })
    } else {
      setMenuAnchorPosition(null)
    }
  }

  const handleCloseMenu = () => {
    setMenuRowKey(null)
    setMenuAnchorEl(null)
    setMenuAnchorPosition(null)
  }

  return (
    <Box sx={{ px: 3, py: 2 }}>
      <h1 className="flex items-center gap-2">
        SGT Deployment Uptime

        <FilterMenu
          label="Partner"
          options={partnerOptions}
          value={selectedPartners}
          noSelectedSort
          onChange={handlePartnerFilterChange}
        />

        {/*
        <FilterMenu
          label="Sort"
          options={SORT_OPTIONS}
          value={sortBy}
          multiple={false}
          noSelectedSort
          ButtonComponent={<Button size="medium">Sort: {sortBy.label}<ExpandMoreIcon /></Button>}
          onChange={(items) => handleSortChange(items as SortOption | SortOption[] | null)}
        />
        */}

        <FilterMenu
          label="Labels"
          options={LABEL_FIELD_OPTIONS}
          value={labelFields}
          noSelectedSort
          ButtonComponent={<Button size="medium">Labels<ExpandMoreIcon /></Button>}
          onChange={(items) => handleLabelFieldsChange(items as (string | LabelFieldOption)[])}
        />

        {hasActiveControls &&
          <Button
            variant="outlined"
            onClick={handleClearControls}
            disabled={!hasActiveControls}
            startIcon={<Replay />}
          >
            Reset
          </Button>
        }
      </h1>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 2 }}>
        {/* <Typography variant="body2" color="text.secondary">Phase</Typography> */}
        <ToggleButtonGroup
          exclusive
          size="small"
          value={selectedPhase}
          onChange={handlePhaseChange}
          aria-label="Filter SGT nodes by phase"
        >
          {PHASE_OPTIONS.map((phase) => (
            <ToggleButton key={phase} value={phase} aria-label={phase}>
              {phase}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Showing Prometheus up status for deployed SGT nodes over the last {DEFAULT_DAYS} days
        at {queryStepSeconds}s resolution.
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 4 }}>
          <CircularProgress size={20} />
          <Typography>Loading deployed SGT node uptime...</Typography>
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error">{error}</Alert>
      )}

      {!loading && !error && rowCount == 0 && (
        <Alert severity="info">No deployed SGT nodes with Prometheus uptime data were found.</Alert>
      )}

      {!loading && !error && rowCount > 0 && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {rowCount} SGT nodes{selectedPhase == 'All' ? '' : ` in ${selectedPhase}`}
            {partnerOptions.length > 0 && ` with partners: ${partnerOptions.map((o) => o.label).join(', ')}`}
          </Typography>
          {labelFields.length > 0 && (
            <SortStrip
              labelFields={labelFields}
              activeSortId={sortBy.id}
              sortDirection={sortDirection}
              onSort={handleSortWithDirection}
              onRemoveLabel={(id) => setLabelFields((prev) => prev.filter((field) => field != id))}
            />
          )}
          <TimelineChart
            data={filteredTimelineData as TimelineData}
            startTime={startTime}
            endTime={endTime}
            cellHeightPx={TIMELINE_CELL_HEIGHT_PX}
            touchIntervals
            yFormat={(rowKey) => {
              const info = rowInfoByKey[rowKey]
              if (!info) return rowKey

              const labelNode = renderRowLabel(info, labelFields)

              return (
                <NodeLabelTrigger
                  label={labelNode}
                  onOpen={(event) => handleOpenMenuFromLabel(rowKey, event)}
                />
              )
            }}
            onCellClick={handleOpenMenuFromCell}
            colorCell={(value) => value > 0 ? color.green : color.red4}
            tooltip={(item) => (
              (() => {
                const start = new Date(item.timestamp)
                const end = item.end ? new Date(item.end) : null
                const state = item.meta?.state || 'unknown'
                const stateColor = state == 'up' ? '#06af00' : (state == 'down' ? '#890000' : '#999')
                const rowLabel = displayLabelByKey[item.row] || item.row

                return (
                  `${rowLabel}<br>` +
                  `<b>Range:</b> ${start.toLocaleString()} - ${end ? end.toLocaleString() : 'ongoing'}<br>` +
                  `${item.meta?.partner ? `<b>Partner:</b> ${item.meta.partner}<br>` : ''}` +
                  `<b>Status:</b> <span style="color:${stateColor};font-weight:700;">${state}</span><br>`
                )
              })()
            )}
          />

          <NodeContextMenu
            open={!!menuLabel && (!!menuAnchorEl || !!menuAnchorPosition)}
            label={menuLabel}
            anchorEl={menuAnchorEl}
            anchorPosition={menuAnchorPosition}
            portalNodeUrl={portalNodeUrl}
            grafanaUrl={grafanaUrl}
            onClose={handleCloseMenu}
          />
        </>
      )}
    </Box>
  )
}