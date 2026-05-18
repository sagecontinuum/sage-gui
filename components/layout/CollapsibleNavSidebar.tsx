import {
  ClickAwayListener,
  Divider,
  IconButton,
  List,
  ListSubheader,
  Paper,
  Popper,
  styled,
  Tooltip
} from '@mui/material'
import { NavLink } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ArrowDropDown } from '@mui/icons-material'

import { Sidebar } from '/components/layout/Layout'
import * as LS from '/components/apis/localStorage'

const AnimatedSidebar = styled(Sidebar)`
  transition: width .5s ease;
  position: fixed;
  top: 60px;
  height: calc(100vh - 60px);
  overflow-y: auto;
  overflow-x: hidden;

  /* Hide content that overflows during animation */
  .nav-label {
    opacity: 1;
    transition: opacity 0.2s ease;
  }

  /* Delay showing labels when expanding */
  &[data-minimized="false"] .nav-label {
    transition-delay: 0.3s;
  }

  /* Hide labels immediately when minimizing */
  &[data-minimized="true"] .nav-label {
    opacity: 0;
    transition-delay: 0s;
  }
`

const Item = styled(NavLink)`
  width: 100%;
  font-size: 1.1em;
  color: ${({ theme }) => theme.palette.mode === 'dark' ? '#bbb' : '#444'};
  border-right: 3px solid ${({ theme }) => theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5'};
  border-top: 1px solid transparent;
  border-bottom: 1px solid transparent;
  padding: 8px 4px 8px 0px;
  position: relative;

  span {
    opacity: 1;
    transition: opacity 0.3s ease 0.1s;
    white-space: nowrap;
  }

  /* Default expanded icon sizes */
  > div > .MuiSvgIcon-root,
  > div > svg {
    font-size: 2em;
  }

  &.indent {
    padding-left: 1rem;
    font-size: 0.9em;
  }

  &.indent > div > .MuiSvgIcon-root,
  &.indent > div > svg {
    font-size: 1.5em;
  }

  /* Minimized state with larger icons like apps/jobs sidebar */
  &.minimized {
    flex-direction: column;
    justify-content: center;
    padding: 10px;
    gap: 2px;
    font-size: 0.9em; /* Override any font-size for consistent sizing */

    &.indent {
      padding: 10px;
      font-size: 0.9em; /* Ensure indent items have same base font-size */
    }

    .minimized-label {
      font-size: 1em;
      margin-top: 0;
      text-align: center;
    }

    > div > .MuiSvgIcon-root,
    > div > svg {
      font-size: 2.5em;
    }

    &.indent > div > .MuiSvgIcon-root,
    &.indent > div > svg {
      font-size: 2.5em;
    }
  }

  :hover{
    text-decoration: none;
    background-color: ${({ theme }) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#f0f0f0'};
  }

  :hover:not(.active) {
    color: ${({ theme }) => theme.palette.mode === 'dark' ? '#fff' : '#000'};
  }

  &.active {
    border-right: 3px solid ${({ theme }) => theme.palette.primary.main};
    border-top: 1px solid ${({ theme }) => theme.palette.mode === 'dark' ? '#333' : '#eee'};
    border-bottom: 1px solid ${({ theme }) => theme.palette.mode === 'dark' ? '#333' : '#eee'};

    background: ${({ theme }) => theme.palette.mode === 'dark' ? '#2a2a2a' : 'rgb(255, 255, 255)'};
    font-weight: 800;
  }

  &.active .MuiSvgIcon-root {
    color: ${({ theme }) => theme.palette.primary.main};
  }
`

const MinimizeButtonWrapper = styled('div')`
  display: flex;
  padding: 8px 8px 4px;
  border-bottom: 1px solid ${({ theme }) => theme.palette.mode === 'dark' ? '#333' : '#e0e0e0'};
  margin-bottom: 4px;

  &.minimized {
    justify-content: center;
    border-bottom: none;
    margin-bottom: 0;
  }
`

const MinimizeButton = styled(IconButton)`
  color: ${({ theme }) => theme.palette.mode === 'dark' ? '#888' : '#666'};
  background-color: ${({ theme }) =>
    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'};
  border-radius: 4px;
  padding: 4px;
  transition: all 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.palette.primary.main};
    background-color: ${({ theme }) =>
      theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'};
    transform: scale(1.05);
  }

  .MuiSvgIcon-root {
    font-size: 1.2rem;
  }

  .minimized & {
    background-color: transparent;
    border-radius: 0;
    padding: 0;
  }

  .minimized &:hover {
    background-color: transparent;
    transform: none;
  }
`

const Nav = styled('div')`
  margin-top: 0;
  flex: 1;
  overflow-y: auto;
`

const BottomNav = styled('div')`
  border-top: 1px solid ${({ theme }) => theme.palette.mode === 'dark' ? '#333' : '#e0e0e0'};
  padding-top: 4px;
`

const SubmenuPaper = styled(Paper)`
  min-width: 220px;
  padding: 6px;
  margin-left: 10px;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.palette.mode === 'dark' ? '#333' : '#e0e0e0'};
  background: ${({ theme }) => theme.palette.mode === 'dark' ? '#1f1f1f' : '#fff'};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
`

const SubmenuList = styled(List)`
  padding: 0;
`

const SubmenuHeader = styled(ListSubheader)`
  border-radius: 12px;
  margin-bottom: 4px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  // text-transform: uppercase;
  line-height: 1.8;
  background: ${({ theme }) => theme.palette.mode === 'dark' ? '#262626' : '#f7f7f7'};
  color: ${({ theme }) => theme.palette.mode === 'dark' ? '#bbb' : '#666'};
`

const REGULAR_TOOLTIP_ENTER_DELAY = 180

const SubmenuLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  color: ${({ theme }) => theme.palette.mode === 'dark' ? '#ddd' : '#333'};

  &:hover {
    text-decoration: none;
    background: ${({ theme }) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5'};
  }

  &.active {
    color: ${({ theme }) => theme.palette.primary.main};
    background: ${({ theme }) => theme.palette.mode === 'dark' ? '#252525' : '#f7f9ff'};
    font-weight: 700;
  }
`

const SubmenuLabel = styled('span')`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
`

const SubmenuLabelMain = styled('span')`
  overflow: hidden;
  text-overflow: ellipsis;
`

const SubmenuLabelMeta = styled('span')`
  margin-left: auto;
  font-size: 0.8em;
  opacity: 0.7;
  text-align: right;
`

const ExpandButton = ({ expanded, onToggle }: { expanded?: boolean, onToggle: () => void }) => (
  <IconButton
    size="small"
    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle() }}
    sx={{
      padding: 0,
      minWidth: 'auto',
      position: 'absolute',
    }}
  >
    <ArrowDropDown style={{
      transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
      transition: 'transform 0.2s',
    }} />
  </IconButton>
)

export type NavItem = {
  to?: string
  icon: React.ReactNode
  label: string | React.ReactNode
  submenuLabel?: string | React.ReactNode
  submenuMetaLabel?: string | React.ReactNode
  tooltip?: string
  indent?: boolean
  divider?: boolean
  expandable?: boolean
  expanded?: boolean
  parentId?: string
  minimizedLabel?: string
  pinBottom?: boolean
} | 'divider'

type Props = {
  navItems: NavItem[]
  storageKey?: string
  minimizedWidth?: string
  expandedWidth?: string
  defaultExpanded?: Record<string, boolean>
  defaultMinimized?: boolean
  forceMinimized?: boolean
  collapsible?: boolean
  submenuMode?: 'inline' | 'popover'
  submenuTrigger?: 'hover' | 'click' | 'hover-or-click'
  header?: React.ReactNode
  itemIdGenerator?: (item: NavItem) => string
  onMinimizedChange?: (minimized: boolean) => void
}

export default function CollapsibleNavSidebar({
  navItems,
  storageKey = 'sidebar.state',
  minimizedWidth = '75px',
  expandedWidth = '160px',
  defaultExpanded = {},
  defaultMinimized = false,
  forceMinimized = false,
  collapsible = true,
  submenuMode = 'inline',
  submenuTrigger = 'hover',
  header,
  itemIdGenerator = (item) => item !== 'divider' ? (item.to || '') : '',
  onMinimizedChange
}: Props) {
  const [minimized, setMinimized] = useState(() => {
    if (forceMinimized) {
      return true
    }

    const stored = LS.get(storageKey)
    if (stored) {
      const parsed = JSON.parse(stored)
      return typeof parsed === 'object' ? parsed.minimized ?? defaultMinimized : parsed
    }
    return defaultMinimized
  })
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(() => {
    const stored = LS.get(storageKey)
    if (stored) {
      const parsed = JSON.parse(stored)
      return typeof parsed === 'object' ? parsed.expanded ?? defaultExpanded : defaultExpanded
    }
    return defaultExpanded
  })
  const [submenuState, setSubmenuState] = useState<{
    itemId: string
    anchorEl: HTMLElement | null
  }>({ itemId: '', anchorEl: null })
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (forceMinimized && !minimized) {
      setMinimized(true)
      return
    }

    LS.set(storageKey, { minimized, expanded: expandedItems })
    onMinimizedChange?.(minimized)
  }, [forceMinimized, minimized, expandedItems, storageKey, onMinimizedChange])

  const toggleMinimized = () => {
    setMinimized(!minimized)
  }

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  const clearScheduledClose = () => {
    if (!closeTimeoutRef.current) return
    clearTimeout(closeTimeoutRef.current)
    closeTimeoutRef.current = null
  }

  const closeSubmenu = () => {
    clearScheduledClose()
    setSubmenuState({ itemId: '', anchorEl: null })
  }

  const scheduleCloseSubmenu = () => {
    clearScheduledClose()
    closeTimeoutRef.current = setTimeout(() => {
      setSubmenuState({ itemId: '', anchorEl: null })
      closeTimeoutRef.current = null
    }, 120)
  }

  const getItemId = (item: NavItem) => itemIdGenerator(item)

  const getChildItems = (itemId: string) =>
    navItems.filter((child): child is Exclude<NavItem, 'divider'> =>
      child !== 'divider' && child.parentId === itemId
    )

  const openSubmenu = (itemId: string, anchorEl: HTMLElement) => {
    clearScheduledClose()
    setSubmenuState({ itemId, anchorEl })
  }

  const shouldUseSubmenu = (item: Exclude<NavItem, 'divider'>) =>
    submenuMode === 'popover' && getChildItems(getItemId(item)).length > 0

  const shouldOpenOnHover = submenuTrigger === 'hover' || submenuTrigger === 'hover-or-click'
  const shouldOpenOnClick = submenuTrigger === 'click' || submenuTrigger === 'hover-or-click'

  const openSubmenuItem = navItems.find((item): item is Exclude<NavItem, 'divider'> =>
    item !== 'divider' && getItemId(item) === submenuState.itemId
  )
  const openSubmenuItems = openSubmenuItem ? [openSubmenuItem, ...getChildItems(submenuState.itemId)] : []
  const openSubmenuLabel =
    typeof openSubmenuItem?.label === 'string' ?
      openSubmenuItem.label :
      openSubmenuItem?.tooltip || 'Submenu'

  useEffect(() => () => clearScheduledClose(), [])

  return (
    <AnimatedSidebar width={minimized ? minimizedWidth : expandedWidth} data-minimized={minimized}
      style={{ display: 'flex', flexDirection: 'column' }}>
      {collapsible && (
        <MinimizeButtonWrapper className={minimized ? 'minimized' : 'flex justify-end'}>
          <MinimizeButton onClick={toggleMinimized} size="small">
            {minimized ? <ChevronRight /> : <ChevronLeft />}
          </MinimizeButton>
        </MinimizeButtonWrapper>
      )}
      {minimized && <Divider sx={{margin: '10px 0'}} />}
      {!minimized && header && <>
        {header}
        <Divider sx={{margin: '8px 0 4px 0'}} />
      </>}
      <Nav>
        {navItems.filter(item => item === 'divider' || !item.pinBottom).map((item, index) => {
          if (item == 'divider') {
            return <Divider key={`divider-${index}`} sx={{margin: '10px 0'}} />
          }

          if (submenuMode === 'popover' && item.parentId) {
            return null
          }

          // Skip child items if parent is collapsed
          if (submenuMode === 'inline' && item.parentId && !expandedItems[item.parentId]) {
            return null
          }

          const itemId = getItemId(item)
          const isExpanded = expandedItems[itemId] ?? item.expanded
          const hasSubmenu = shouldUseSubmenu(item)

          const itemContent = (
            <Item
              key={item.to}
              to={item.to || ''}
              className={`flex items-center ${minimized ? 'gap minimized' : ''}${item.indent ? ' indent' : ''}`}
              end={!(minimized && item.expandable && !isExpanded)}
              onMouseEnter={hasSubmenu && shouldOpenOnHover ?
                evt => openSubmenu(itemId, evt.currentTarget) :
                undefined}
              onMouseLeave={hasSubmenu && shouldOpenOnHover ? scheduleCloseSubmenu : undefined}
              onClick={hasSubmenu && shouldOpenOnClick ? closeSubmenu : undefined}
            >
              {item.expandable && !minimized && !hasSubmenu && (
                <ExpandButton expanded={isExpanded} onToggle={() => toggleExpanded(itemId)} />
              )}
              <div style={{
                marginLeft: item.expandable && !minimized ? '1.3rem' : minimized ? '0' : '1.3rem',
              }} className="flex items-center">
                {item.icon}
              </div>
              {!minimized ? (
                <div className="nav-label" style={{ marginLeft: '.5rem' }}>{item.label}</div>
              ) : (
                <div className="minimized-label">{item.minimizedLabel || item.label}</div>
              )}
            </Item>
          )

          return (
            hasSubmenu ?
              itemContent :
              <Tooltip
                key={item.to}
                title={item.tooltip || item.label}
                placement="right"
                enterDelay={REGULAR_TOOLTIP_ENTER_DELAY}
              >
                {itemContent}
              </Tooltip>
          )
        })}
      </Nav>
      {navItems.some(item => item !== 'divider' && item.pinBottom) && (
        <BottomNav>
          {navItems.filter(item => item !== 'divider' && item.pinBottom).map((item) => {
            if (item === 'divider') return null
            const itemId = itemIdGenerator(item)
            const isExpanded = expandedItems[itemId] ?? item.expanded
            const hasSubmenu = shouldUseSubmenu(item)
            const itemContent = (
              <Item
                key={item.to}
                to={item.to || ''}
                className={`flex items-center ${minimized ? 'gap minimized' : ''}${item.indent ? ' indent' : ''}`}
                end={!(minimized && item.expandable && !isExpanded)}
                onMouseEnter={hasSubmenu && shouldOpenOnHover ?
                  evt => openSubmenu(itemId, evt.currentTarget) :
                  undefined}
                onMouseLeave={hasSubmenu && shouldOpenOnHover ? scheduleCloseSubmenu : undefined}
                onClick={hasSubmenu && shouldOpenOnClick ? closeSubmenu : undefined}
              >
                {item.expandable && !minimized && !hasSubmenu && (
                  <ExpandButton expanded={isExpanded} onToggle={() => toggleExpanded(itemId)} />
                )}
                <div style={{
                  marginLeft: item.expandable && !minimized ? '1.3rem' : minimized ? '0' : '1.3rem',
                }} className="flex items-center">
                  {item.icon}
                </div>
                {!minimized ? (
                  <div className="nav-label" style={{ marginLeft: '.5rem' }}>{item.label}</div>
                ) : (
                  <div className="minimized-label">{item.minimizedLabel || item.label}</div>
                )}
              </Item>
            )
            return (
              hasSubmenu ?
                itemContent :
                <Tooltip
                  key={item.to}
                  title={item.tooltip || item.label}
                  placement="right"
                  enterDelay={REGULAR_TOOLTIP_ENTER_DELAY}
                >
                  {itemContent}
                </Tooltip>
            )
          })}
        </BottomNav>
      )}
      <Popper
        open={Boolean(submenuState.anchorEl && openSubmenuItems.length)}
        anchorEl={submenuState.anchorEl}
        placement="right-start"
        sx={{ zIndex: 1400 }}
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [8, 0]
            }
          }
        ]}
      >
        <ClickAwayListener onClickAway={closeSubmenu}>
          <SubmenuPaper onMouseEnter={clearScheduledClose} onMouseLeave={scheduleCloseSubmenu}>
            <SubmenuList
              subheader={<SubmenuHeader disableSticky>{openSubmenuLabel}</SubmenuHeader>}
            >
              {openSubmenuItems.map((item) => (
                <SubmenuLink
                  key={item.to}
                  to={item.to || ''}
                  end
                  onClick={closeSubmenu}
                  className={item.parentId ? 'submenu-child' : 'submenu-parent'}
                >
                  <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                  <SubmenuLabel>
                    <SubmenuLabelMain>{item.submenuLabel || item.label}</SubmenuLabelMain>
                    {item.submenuMetaLabel && (
                      <SubmenuLabelMeta>{item.submenuMetaLabel}</SubmenuLabelMeta>
                    )}
                  </SubmenuLabel>
                </SubmenuLink>
              ))}
            </SubmenuList>
          </SubmenuPaper>
        </ClickAwayListener>
      </Popper>
    </AnimatedSidebar>
  )
}
