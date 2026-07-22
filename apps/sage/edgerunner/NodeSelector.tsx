import { useEffect, useMemo, useRef, useState } from 'react'
import { Divider, MenuItem, Select } from '@mui/material'
import { ListSubheader, SearchListSubheader } from '/components/layout/Layout'
import { compactMenuItemSx, compactSelectSx } from './selectStyles'

export const nodeOptions = ['H00F', 'H00B'] as const

export const summerCampNodes = [
  'H00F',
  'H00B',
  'H01D',
  'H01E',
  'H01F',
  'H020',
  'H021',
  'H022',
  'H023',
  'H02A',
  'H02C',
  'H02D',
  'H02E',
  'H02F',
  'H030',
  'H031',
  'H032',
  'H033',
  'H034',
  'H035',
  'H037',
  'H038',
  'H039',
  'H03A',
  'H03B',
  'H03C',
  'H03D',
  'H03E',
  'H03F',
  'H040',
  'H041',
  'H042',
  'H043'
] as const

type Props = {
  value: string
  onChange: (value: string) => void
}

const filterNodes = (options: readonly string[], query: string) => {
  const q = query.trim().toLowerCase()
  if (!q) return options

  return options.filter((option) => option.toLowerCase().includes(q))
}

export default function NodeSelector(props: Props) {
  const { value, onChange } = props

  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const keepMenuOpenRef = useRef(false)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const handleKeepMenuOpen = (keepOpen: boolean) => {
    keepMenuOpenRef.current = keepOpen
  }

  const selectedLabel = useMemo(() => value, [value])

  const visibleSummerCampNodes = useMemo(() => {
    return filterNodes(summerCampNodes, searchQuery)
  }, [searchQuery])

  const visibleNodeOptions = useMemo(() => {
    const nodes = nodeOptions.filter((node) => {
      return !summerCampNodes.includes(node as typeof summerCampNodes[number])
    })
    return filterNodes(nodes, searchQuery)
  }, [searchQuery])

  useEffect(() => {
    if (!isOpen) return
    requestAnimationFrame(() => searchInputRef.current?.focus())
  }, [isOpen])

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
      renderValue={() => `node ${selectedLabel}`}
      sx={{
        ...compactSelectSx,
        minWidth: 92
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
        placeholder="Search nodes"
        keepMenuOpen={handleKeepMenuOpen}
        inputRef={searchInputRef}
      />

      <ListSubheader>Summer camp</ListSubheader>
      {visibleSummerCampNodes.map((node) => (
        <MenuItem key={node} value={node} sx={compactMenuItemSx}>
          {node}
        </MenuItem>
      ))}

      {!!visibleSummerCampNodes.length && !!visibleNodeOptions.length && <Divider />}

      <ListSubheader>Other nodes</ListSubheader>
      {visibleNodeOptions.map((node) => (
        <MenuItem key={node} value={node} sx={compactMenuItemSx}>
          {node}
        </MenuItem>
      ))}
    </Select>
  )
}