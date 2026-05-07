import { type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Link } from 'react-router-dom'

import { type LabelFieldId, type RowInfo } from './types'

export function NodeLabelTrigger({ label, onOpen }: {
  label: ReactNode
  onOpen: (event: ReactMouseEvent<HTMLElement>) => void
}) {
  return (
    <Link
      to="#"
      onClick={(event) => {
        event.preventDefault()
        onOpen(event)
      }}
      onMouseDown={(event) => event.preventDefault()}
      style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%' }}
    >
      <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
        {label}
      </Box>
      <ExpandMoreIcon sx={{ fontSize: '1rem', verticalAlign: 'middle' }} />
    </Link>
  )
}

export function renderRowLabel(rowInfo: RowInfo, fields: LabelFieldId[]) {
  const leftParts = [
    fields.includes('phase') ? rowInfo.phase : '',
    fields.includes('partner') ? rowInfo.partner : ''
  ].filter(Boolean)
  const rightParts = [
    fields.includes('site_id') ? rowInfo.siteId : '',
    fields.includes('vsn') ? rowInfo.vsn : ''
  ].filter(Boolean)

  if (leftParts.length == 0) {
    return rightParts.join(' | ') || rowInfo.vsn
  }

  if (rightParts.length == 0) {
    return leftParts.join(' | ')
  }

  return (
    <Box
      component="span"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        width: '100%',
        minWidth: 0,
        whiteSpace: 'nowrap'
      }}
    >
      <Box component="span" sx={{ textAlign: 'left', flexShrink: 0 }}>
        {leftParts.join(' | ')}
      </Box>
      <Box component="span" sx={{ textAlign: 'right', minWidth: 0 }}>
        {rightParts.join(' | ')}
      </Box>
    </Box>
  )
}
