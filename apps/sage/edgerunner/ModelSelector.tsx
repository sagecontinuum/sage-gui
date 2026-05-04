import { useMemo, useRef, useState } from 'react'
import { styled } from '@mui/material/styles'
import { Box, Divider, ListSubheader, MenuItem, Select, TextField, type Theme } from '@mui/material'
import { ArrowRightRounded, SearchRounded } from '@mui/icons-material'
import { experimentalModelOptions, modelOptions, sageRecommendedModelOptions } from './models'
import { compactHeaderSx, compactMenuItemSx, compactSelectSx } from './selectStyles'

type Props = {
  value: string
  onChange: (value: string) => void
}

const filterModelOptions = (options: typeof modelOptions, query: string) => {
  const q = query.trim().toLowerCase()
  if (!q) {
    return options
  }

  return options.filter((option) => {
    return option.label.toLowerCase().includes(q) || option.value.toLowerCase().includes(q)
  })
}

export default function ModelSelector(props: Props) {
  const { value, onChange } = props

  const [isOpen, setIsOpen] = useState(false)
  const [showOtherModels, setShowOtherModels] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const keepMenuOpenRef = useRef(false)

  const selectedLabel = useMemo(() => {
    return modelOptions.find((option) => option.value == value)?.label || value
  }, [value])

  const sageRecommendedValues = useMemo(() => {
    return new Set(sageRecommendedModelOptions.map((option) => option.value))
  }, [])

  const otherModelOptions = useMemo(() => {
    return experimentalModelOptions.filter((option) => !sageRecommendedValues.has(option.value))
  }, [sageRecommendedValues])

  const visibleSageRecommended = useMemo(() => {
    return filterModelOptions(sageRecommendedModelOptions, searchQuery)
  }, [searchQuery])

  const visibleOtherModels = useMemo(() => {
    return filterModelOptions(otherModelOptions, searchQuery)
  }, [otherModelOptions, searchQuery])

  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value as string)}
      open={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => {
        if (keepMenuOpenRef.current) {
          keepMenuOpenRef.current = false
          return
        }
        setIsOpen(false)
      }}
      variant="standard"
      disableUnderline
      renderValue={() => selectedLabel}
      sx={{
        ...compactSelectSx,
        minWidth: 140
      }}
      MenuProps={{
        disableAutoFocusItem: true,
        PaperProps: {
          sx: {
            maxHeight: 380,
            minWidth: 280,
            width: 'fit-content',
            maxWidth: 420,
            '& .MuiMenuItem-root': {
              whiteSpace: 'nowrap'
            }
          }
        }
      }}
    >
      <ListSubheader sx={searchHeaderSx}>
        <TextField
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          slotProps={{
            input: {
              'aria-label': 'Search models',
              startAdornment: <SearchRounded fontSize="small" />
            }
          }}
          placeholder="Search models"
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
      </ListSubheader>

      <ListSubheader sx={compactHeaderSx}>
        Sage recommended
      </ListSubheader>
      {visibleSageRecommended.map((option) => (
        <MenuItem
          key={`sage-${option.value}`}
          value={option.value}
          sx={{
            ...compactMenuItemSx,
            ...(option.recommended ? {
              fontWeight: 600
            } : {})
          }}
        >
          {option.label}
        </MenuItem>
      ))}

      <Divider />
      <ListSubheader
        sx={otherHeaderSx}
      >
        <Box
          className="other-models-toggle"
          component="button"
          type="button"
          onMouseDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
            keepMenuOpenRef.current = true
            setShowOtherModels((prev) => !prev)
            setIsOpen(true)
          }}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
        >
          <span>Other models (experimental)</span>
          <Box className="right-controls">
            <ExpandIcon expanded={showOtherModels}>
              <ArrowRightRounded fontSize="small" />
            </ExpandIcon>
          </Box>
        </Box>
      </ListSubheader>


      {showOtherModels && visibleOtherModels.map((option) => (
        <MenuItem
          key={`other-${option.value}`}
          value={option.value}
          sx={{
            ...compactMenuItemSx,
            ...(option.recommended ? {
              fontWeight: 600
            } : {})
          }}
        >
          {option.label}
        </MenuItem>
      ))}

      {showOtherModels && !visibleOtherModels.length && (
        <MenuItem disabled sx={compactMenuItemSx}>
          No other models match your search
        </MenuItem>
      )}
    </Select>
  )
}

const searchHeaderSx = (theme: Theme) => ({
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
})

const otherHeaderSx = (theme: Theme) => ({
  background: theme.palette.background.paper,
  color: theme.palette.text.secondary,
  '& .other-models-toggle': {
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
})

const ExpandIcon = styled('span')<{expanded: boolean}>`
  display: inline-flex;
  transition: transform 200ms ease;
  transform: rotate(${(props) => (props.expanded ? 90 : 0)}deg);
`