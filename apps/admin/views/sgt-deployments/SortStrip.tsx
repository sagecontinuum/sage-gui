import { type ReactNode, useState } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import { LABEL_FIELD_OPTIONS, type LabelFieldId, type SortDirection, type SortOptionId } from './types'
import { DeleteOutline } from '@mui/icons-material'

type Props = {
  labelFields: LabelFieldId[]
  activeSortId: SortOptionId
  sortDirection: SortDirection
  onSort: (id: SortOptionId, direction: SortDirection) => void
  onRemoveLabel: (id: LabelFieldId) => void
}

type CaretColumnProps = {
  label: string
  sortId: SortOptionId
  activeSortId: SortOptionId
  sortDirection: SortDirection
  onSort: (id: SortOptionId, direction: SortDirection) => void
  labelColor?: string
  children?: ReactNode
}

function CaretColumn({ label, sortId, activeSortId, sortDirection, onSort, children }: CaretColumnProps) {
  const isActive = activeSortId == sortId

  return (
    <>
      <Box sx={{ position: 'relative', height: '2.2rem', overflow: 'visible', width: '100%' }}>
        <Box
          component="span"
          sx={{
            position: 'absolute',
            bottom: 2,
            left: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.15,
            transform: 'rotate(-45deg)',
            transformOrigin: 'left bottom',
            whiteSpace: 'nowrap',
          }}
        >
          <Typography
            component="span"
            variant="caption"
            sx={{
              fontSize: '0.68rem',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? 'primary.main' : 'text.secondary',
              lineHeight: 1,
            }}
          >
            {label}
          </Typography>
          {children}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Tooltip title={`Sort ${label} ascending`} placement="top" arrow>
          <span>
            <IconButton
              size="small"
              onClick={() => onSort(sortId, 'asc')}
              sx={{ p: 0, lineHeight: 1 }}
              aria-label={`Sort ${label} ascending`}
            >
              <ExpandLessIcon
                sx={{
                  fontSize: '1.14rem',
                  color: isActive && sortDirection == 'asc' ? 'primary.main' : 'text.secondary',
                  opacity: isActive && sortDirection == 'asc' ? 1 : 0.45,
                }}
              />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={`Sort ${label} descending`} arrow>
          <span>
            <IconButton
              size="small"
              onClick={() => onSort(sortId, 'desc')}
              sx={{ p: 0, lineHeight: 1, mt: -2 }}
              aria-label={`Sort ${label} descending`}
            >
              <ExpandMoreIcon
                sx={{
                  fontSize: '1.14rem',
                  color: isActive && sortDirection == 'desc' ? 'primary.main' : 'text.secondary',
                  opacity: isActive && sortDirection == 'desc' ? 1 : 0.45,
                }}
              />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </>
  )
}

export default function SortStrip({ labelFields, activeSortId, sortDirection, onSort, onRemoveLabel }: Props) {
  const [hoveredCol, setHoveredCol] = useState<LabelFieldId | null>(null)

  return (
    <Box
      sx={{
        display: 'flex',
        mb: -6,
        ml: -0.5,
        px: 0,
        gap: 0,
        alignItems: 'flex-start',
        position: 'relative',
        zIndex: 2,
        pointerEvents: 'none'
      }}
    >
      <Box sx={{ display: 'flex', gap: 4, pointerEvents: 'auto' }}>
        {LABEL_FIELD_OPTIONS.filter((option) => labelFields.includes(option.id)).map((option) => {
          const sortLabel = option.id == 'site_id' ? 'Site' : option.label

          return (
            <Box
              key={option.id}
              onMouseEnter={() => setHoveredCol(option.id)}
              onMouseLeave={() => setHoveredCol(null)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderRadius: 0.75,
                px: 0.25,
                py: 0.15
              }}
            >
              <CaretColumn
                label={sortLabel}
                sortId={option.id}
                activeSortId={activeSortId}
                sortDirection={sortDirection}
                onSort={onSort}
              >
                {hoveredCol === option.id && (
                  <Tooltip title={`Remove ${sortLabel} label`} placement="top" arrow>
                    <IconButton
                      size="small"
                      onClick={() => onRemoveLabel(option.id)}
                      sx={{
                        p: 0,
                        lineHeight: 1,
                        color: 'text.secondary',
                        ml: 0.15,
                        '&:hover': { color: 'error.main' },
                      }}
                      aria-label={`Remove ${sortLabel} label`}
                    >
                      <DeleteOutline sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                )}
              </CaretColumn>
            </Box>
          )
        })}
      </Box>

      <Box
        sx={{
          ml: 'auto',
          mt: -1,
          mr: '15rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: 0.25,
          pointerEvents: 'auto',
        }}
      >
        <CaretColumn
          label="Status"
          sortId="up_down"
          activeSortId={activeSortId}
          sortDirection={sortDirection}
          onSort={onSort}
        />
      </Box>
    </Box>
  )
}
