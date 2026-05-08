import { type ReactElement, type ReactNode } from 'react'

import { styled, GlobalStyles } from '@mui/material'
import MuiDivider from '@mui/material/Divider'
import MuiListSubheader from '@mui/material/ListSubheader'
import { Card as MuiCard, type CardProps } from '@mui/material'
import { Box, TextField, type Theme } from '@mui/material'
import { SearchRounded, ArrowRightRounded } from '@mui/icons-material'

export const Item = styled(MuiCard)`
  position: relative;
  margin: 20px 1px; // 1px left/right for sticky header
  padding: 10px 15px;

  :hover {
    text-decoration: none;
    border: 1px solid ${props => props.theme.palette.primary.main};
  }

  .actions {
    position: absolute;
    display: none;
    bottom: .5rem;
    right: .6rem;
  }

  :hover .actions {
    display: block;
  }
`

export const Title = styled('h2')`
  margin: 0;
`

export const Top = styled('div')<{top?: string}>`
  position: sticky;
  top: ${props => props.top || '60px'};
  z-index: 100;
`

export const Controls = styled('div')`
  background-color: ${props => props.theme.palette.background.paper};
  padding: 10px 0;
  border-bottom: 1px solid ${props => props.theme.palette.divider};

  .checkboxes {
    margin-top: 17px;
  }
`

export const Divider = () =>
  <MuiDivider orientation="vertical" flexItem style={{margin: '0px 20px'}} />

export const Sidebar = styled('div')<{width?: string}>`
  position: sticky;
  top: 60px;
  height: calc(100vh);
  padding-top: 10px;
  width: ${props => props.width || '250px'};
  min-width: ${props => props.width || '250px'};
  border-right: 1px solid ${props => props.theme.palette.divider};
  background: ${({ theme }) => theme.palette.mode === 'dark' ? '#1e1e1e' : '#f8f8f8'};
  overflow-y: scroll;
`

export const FilterTitle =  styled('h2')`
  margin-left: 20px;
`


// second version of card design (WIP)
export const CardViewStyle =
  <GlobalStyles
    styles={(theme) => ({
      body: {
        // todo(nc): configure secondary light/dark mode background colors
        background: theme.palette.mode === 'dark' ? 'rgb(30, 30, 30)' : 'rgb(231, 235, 240)',
      }
    })}
  />


type Props = {
  noPad?: boolean
  children: ReactElement | ReactElement[]
} & CardProps

export const Card = (props: Props) => {
  const {children, noPad, ...rest} = props

  return (
    <MuiCard sx={{padding: noPad ? 0 : '16px 16px 20px 16px'}} {...rest}>
      {children}
    </MuiCard>
  )
}


// ============ ListSubheader Components ============

/**
 * List subheader with consistent styling (blue background, bold text).
 * Used in select menus and dropdowns throughout the app.
 */
export const ListSubheader = ({ children }: { children: ReactNode }) => (
  <MuiListSubheader sx={{
    fontSize: '0.75rem',
    fontWeight: 'bold',
    width: '100%',
    background: '#2e76a3',
    color: '#f2f2f2',
    padding: '4px 5px',
    lineHeight: 1.2
  }}>
    {children}
  </MuiListSubheader>
)

/**
 * Sticky search header with TextField for filtering options.
 * Stays visible at top of scrollable menu.
 */
type SearchListSubheaderProps = {
  searchQuery: string
  onSearchChange: (value: string) => void
  placeholder?: string
  keepMenuOpen: (open: boolean) => void
}

export const SearchListSubheader = ({
  searchQuery,
  onSearchChange,
  placeholder = 'Search'
}: SearchListSubheaderProps) => (
  <MuiListSubheader sx={(theme: Theme) => ({
    position: 'sticky',
    top: 0,
    zIndex: 3,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
    py: 0.5,
    px: 1
  })}>
    <TextField
      value={searchQuery}
      onChange={(event) => onSearchChange(event.target.value)}
      slotProps={{
        input: {
          'aria-label': 'Search',
          startAdornment: <SearchRounded fontSize="small" />
        }
      }}
      placeholder={placeholder}
      size="small"
      variant="outlined"
      sx={{
        width: 200,
        '& .MuiInputBase-root': {
          minHeight: 28
        },
        '& .MuiInputBase-input': {
          fontSize: '0.75rem',
          padding: '4px 8px'
        }
      }}
      autoFocus
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    />
  </MuiListSubheader>
)

/**
 * Expandable list subheader with toggle icon and children content.
 * Used for collapsible sections in menus.
 */
type ExpandableListSubheaderProps = {
  isExpanded: boolean
  onToggle: () => void
  children: ReactNode
  keepMenuOpen: (open: boolean) => void
}

export const ExpandableListSubheader = ({
  isExpanded,
  onToggle,
  children,
  keepMenuOpen
}: ExpandableListSubheaderProps) => (
  <MuiListSubheader sx={(theme: Theme) => ({
    background: theme.palette.background.paper,
    color: theme.palette.text.secondary,
    '& .expandable-toggle': {
      appearance: 'none',
      border: 0,
      background: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      fontSize: '0.75rem',
      fontWeight: 700,
      color: 'inherit',
      cursor: 'pointer',
      padding: 0,
      margin: 0,
      textAlign: 'left'
    },
    '& .right-controls': {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px'
    }
  })}>
    <Box
      className="expandable-toggle"
      component="button"
      type="button"
      onMouseDown={(event) => {
        event.preventDefault()
        event.stopPropagation()
        keepMenuOpen(true)
        onToggle()
      }}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
      }}
    >
      <span>{children}</span>
      <Box className="right-controls">
        <ExpandIcon expanded={isExpanded}>
          <ArrowRightRounded fontSize="small" />
        </ExpandIcon>
      </Box>
    </Box>
  </MuiListSubheader>
)

const ExpandIcon = styled('span')<{expanded: boolean}>`
  display: inline-flex;
  transition: transform 200ms ease;
  transform: rotate(${(props) => (props.expanded ? 90 : 0)}deg);
`
