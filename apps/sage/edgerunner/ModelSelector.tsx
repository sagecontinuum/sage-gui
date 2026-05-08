import { useMemo, useRef, useState } from 'react'
import { Divider, MenuItem, Select } from '@mui/material'
import { experimentalModelOptions, modelOptions, sageRecommendedModelOptions } from './models'
import { ListSubheader, SearchListSubheader, ExpandableListSubheader } from '/components/layout/Layout'
import { compactMenuItemSx, compactSelectSx } from './selectStyles'

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

  const handleKeepMenuOpen = (keepOpen: boolean) => {
    keepMenuOpenRef.current = keepOpen
  }

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
      <SearchListSubheader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search models"
        keepMenuOpen={handleKeepMenuOpen}
      />

      <ListSubheader>
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
      <ExpandableListSubheader
        isExpanded={showOtherModels}
        onToggle={() => {
          setShowOtherModels((prev) => !prev)
          setIsOpen(true)
        }}
        keepMenuOpen={handleKeepMenuOpen}
      >
        Other models (experimental)
      </ExpandableListSubheader>

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