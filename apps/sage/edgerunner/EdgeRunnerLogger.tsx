import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode
} from 'react'
import { styled } from '@mui/material/styles'
import { Box, Button, Divider, IconButton, Tooltip, Typography } from '@mui/material'
import BugReportRounded from '@mui/icons-material/BugReportRounded'
import { BugReportOutlined, RefreshRounded, UnfoldLessRounded, UnfoldMoreRounded } from '@mui/icons-material'

export type LogLevel = 'request' | 'completion' | 'error' | 'info'

export type LogEntry = {
  id: number
  level: LogLevel
  message: string
  detail?: unknown
  timestamp: Date
}

type LoggerContextValue = {
  log: (level: LogLevel, message: string, detail?: unknown) => void
}

const LoggerContext = createContext<LoggerContextValue>({
  log: () => undefined
})

export function useLogger() {
  return useContext(LoggerContext)
}

type ProviderProps = {
  children: ReactNode
  onEntry: (entry: LogEntry) => void
}

export function LoggerProvider(props: ProviderProps) {
  const { children, onEntry } = props
  const counterRef = useRef(0)
  const onEntryRef = useRef(onEntry)
  onEntryRef.current = onEntry

  const log = useCallback((level: LogLevel, message: string, detail?: unknown) => {
    const entry: LogEntry = {
      id: ++counterRef.current,
      level,
      message,
      detail,
      timestamp: new Date()
    }
    onEntryRef.current(entry)
  }, []) // stable — onEntry changes are handled via ref

  return (
    <LoggerContext.Provider value={{ log }}>
      {children}
    </LoggerContext.Provider>
  )
}

type Props = {
  entries: LogEntry[]
  onClear: () => void
}

type LogEntryRowProps = {
  entry: LogEntry
  expandAll: boolean
  isExpanded: boolean
  onToggle: (id: number) => void
}

const LEVEL_COLOR: Record<LogLevel, string> = {
  request:    '#2196f3',
  completion: '#4caf50',
  error:      '#f44336',
  info:       '#9e9e9e',
}

const LEVEL_LABEL: Record<LogLevel, string> = {
  request:    'REQ',
  completion: 'OK',
  error:      'ERR',
  info:       'INF',
}

const LOGGER_OPEN_KEY = 'assist-logger-open'
const LOGGER_HEIGHT_KEY = 'assist-logger-height'
const MIN_LOGGER_HEIGHT = 200
const DEFAULT_PREVIEW_LINES = 10

function LogEntryRow(props: LogEntryRowProps) {
  const { entry, expandAll, isExpanded, onToggle } = props
  const messageRef = useRef<HTMLSpanElement | null>(null)
  const detailRef = useRef<HTMLPreElement | null>(null)
  const [isExpandable, setIsExpandable] = useState(false)

  useLayoutEffect(() => {
    const messageOverflows = !!messageRef.current &&
      messageRef.current.scrollHeight > messageRef.current.clientHeight + 1
    const detailOverflows = !!detailRef.current &&
      detailRef.current.scrollHeight > detailRef.current.clientHeight + 1

    setIsExpandable(messageOverflows || detailOverflows)
  }, [entry.detail, entry.message, expandAll, isExpanded])

  return (
    <EntryRow>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'nowrap' }}>
        <Badge style={{ background: LEVEL_COLOR[entry.level] }}>
          {LEVEL_LABEL[entry.level]}
        </Badge>
        <Timestamp>{entry.timestamp.toLocaleTimeString()}</Timestamp>
        <Message ref={messageRef} expanded={expandAll || isExpanded}>{entry.message}</Message>
        {isExpandable && (
          <Tooltip title={expandAll || isExpanded ? 'Collapse' : 'Expand'} placement="right">
            <ActionButton type="button" onClick={() => onToggle(entry.id)}>
              {expandAll || isExpanded
                ? <UnfoldLessRounded fontSize="small"/>
                : <UnfoldMoreRounded fontSize="small"/>}
            </ActionButton>
          </Tooltip>
        )}
      </Box>
      {entry.detail != null && (
        <Detail ref={detailRef} expanded={expandAll || isExpanded}>{
          typeof entry.detail === 'string'
            ? entry.detail
            : JSON.stringify(entry.detail, null, 2)
        }</Detail>
      )}
    </EntryRow>
  )
}

export default function AssistLogger(props: Props) {
  const { entries, onClear } = props
  const rootRef = useRef<HTMLDivElement | null>(null)
  const resizeStateRef = useRef<{startY: number, startHeight: number} | null>(null)
  const [open, setOpen] = useState(() => {
    if (typeof window == 'undefined') return false
    return window.localStorage.getItem(LOGGER_OPEN_KEY) == '1'
  })
  const [panelHeight, setPanelHeight] = useState<number | null>(() => {
    if (typeof window == 'undefined') return null
    const raw = window.localStorage.getItem(LOGGER_HEIGHT_KEY)
    const parsed = raw ? Number(raw) : NaN
    return Number.isFinite(parsed) && parsed >= MIN_LOGGER_HEIGHT ? parsed : null
  })
  const [expandAll, setExpandAll] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (typeof window == 'undefined') return
    window.localStorage.setItem(LOGGER_OPEN_KEY, open ? '1' : '0')
  }, [open])

  useEffect(() => {
    if (typeof window == 'undefined') return
    if (panelHeight == null) {
      window.localStorage.removeItem(LOGGER_HEIGHT_KEY)
      return
    }
    window.localStorage.setItem(LOGGER_HEIGHT_KEY, String(panelHeight))
  }, [panelHeight])

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const startResize = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!rootRef.current) return
    event.preventDefault()
    resizeStateRef.current = {
      startY: event.clientY,
      startHeight: rootRef.current.getBoundingClientRect().height
    }

    const onMouseMove = (moveEvent: MouseEvent) => {
      const state = resizeStateRef.current
      if (!state) return

      // Dragging upward increases the logger height because it is anchored to the bottom.
      const delta = state.startY - moveEvent.clientY
      setPanelHeight(Math.max(MIN_LOGGER_HEIGHT, Math.round(state.startHeight + delta)))
    }

    const onMouseUp = () => {
      resizeStateRef.current = null
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <Root ref={rootRef} open={open} panelHeight={panelHeight}>
      {open && (
        <ToggleBar>
          <Tooltip title="Hide logger" placement="right">
            <IconButton size="small" onClick={() => setOpen(false)}>
              <BugReportRounded fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Hide logger
          </Typography>
          <ActionButton type="button" onClick={() => setPanelHeight(null)}>
            Fill
          </ActionButton>
        </ToggleBar>
      )}

      {open && (
        <Content>
          <ResizeHandle
            role="separator"
            title="Drag to resize logger, double-click to fill available space"
            onMouseDown={startResize}
            onDoubleClick={() => setPanelHeight(null)}
          />
          <Header>
            <Typography variant="caption" sx={{ flex: 1, fontWeight: 600, color: 'text.secondary' }}>
              Logger {entries.length > 0 && `(${entries.length})`}
            </Typography>
            {entries.length > 0 && (
              <Tooltip title={expandAll ? 'Collapse all' : 'Expand all'} placement="top">
                <ActionButton type="button" onClick={() => setExpandAll((v) => !v)}>
                  {expandAll ? <UnfoldLessRounded fontSize="small"/> : <UnfoldMoreRounded fontSize="small"/>}
                </ActionButton>
              </Tooltip>
            )}
            <Tooltip title="Clear" placement="top">
              <IconButton size="small" onClick={onClear}>
                <RefreshRounded fontSize="small" />
              </IconButton>
            </Tooltip>
          </Header>
          <Divider />
          <LogList>
            {entries.length === 0 && (
              <EmptyMsg>No logs yet.</EmptyMsg>
            )}
            {entries.map((entry) => (
              <LogEntryRow
                key={entry.id}
                entry={entry}
                expandAll={expandAll}
                isExpanded={!!expandedRows[entry.id]}
                onToggle={toggleRow}
              />
            ))}
          </LogList>
        </Content>
      )}

      {!open && (
        <ToggleBar>
          <Tooltip title={open ? 'Hide logger' : 'Show logger'} placement="right">
            <Button
              size="small"
              onClick={() => setOpen(true)}
              color="inherit"
              startIcon={
                <BugReportOutlined fontSize="small" />
              }>
              Logger
            </Button>
          </Tooltip>
        </ToggleBar>
      )}
    </Root>
  )
}

const Root = styled('div')<{open: boolean, panelHeight: number | null}>`
  margin-top: auto;
  margin-left: -1rem;
  margin-right: -1rem;
  // border-top: 1px solid ${({ theme }) => theme.palette.divider};
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  ${({ open, panelHeight }) => open ? `
    flex: ${panelHeight == null ? '1 1 auto' : '0 0 auto'};
    height: ${panelHeight == null ? 'auto' : `${panelHeight}px`};
  ` : `
    flex: 0 0 auto;
  `}
`

const Content = styled('div')`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
`

const ResizeHandle = styled('div')`
  height: 8px;
  cursor: ns-resize;
  border-top: 1px solid ${({ theme }) => theme.palette.divider};
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  background: ${({ theme }) => theme.palette.action.hover};
`

const Header = styled('div')`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
`

const LogList = styled('div')`
//  max-height: 260px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding: 4px 14px 4px 6px;
  font-family: 'Fira Mono', 'Consolas', monospace;
  font-size: 0.7rem;
`

const ToggleBar = styled('div')`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  //border-top: 1px solid ${({ theme }) => theme.palette.divider};
`

const EmptyMsg = styled('div')`
  color: ${({ theme }) => theme.palette.text.disabled};
  text-align: center;
  padding: 12px 0;
  font-size: 0.72rem;
`

const EntryRow = styled('div')`
  padding: 3px 0;
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  &:last-child { border-bottom: none; }
`

const Badge = styled('span')`
  display: inline-block;
  font-size: 0.6rem;
  font-weight: 700;
  color: #fff;
  border-radius: 3px;
  padding: 1px 4px;
  flex-shrink: 0;
  letter-spacing: 0.03em;
`

const Timestamp = styled('span')`
  color: ${({ theme }) => theme.palette.text.disabled};
  flex-shrink: 0;
  font-size: 0.65rem;
`

const ActionButton = styled('button')`
  border: 0;
  background: transparent;
//  color: ${({ theme }) => theme.palette.primary.main};
  font-size: 0.65rem;
  padding: 0;
  margin-left: auto;
  cursor: pointer;
  white-space: nowrap;
`

const Message = styled('span')<{expanded: boolean}>`
  color: ${({ theme }) => theme.palette.text.primary};
  word-break: break-word;
  flex: 1;
  min-width: 0;
  ${({ expanded }) => !expanded && `
    display: -webkit-box;
    -webkit-line-clamp: ${DEFAULT_PREVIEW_LINES};
    -webkit-box-orient: vertical;
    overflow: hidden;
  `}
`

const Detail = styled('pre')<{expanded: boolean}>`
  margin: 2px 0 0 0;
  padding: 4px 6px;
  background: ${({ theme }) => theme.palette.action.hover};
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.65rem;
  color: ${({ theme }) => theme.palette.text.secondary};
  ${({ expanded }) => !expanded && `
    display: -webkit-box;
    -webkit-line-clamp: ${DEFAULT_PREVIEW_LINES};
    -webkit-box-orient: vertical;
    overflow: hidden;
  `}
`
