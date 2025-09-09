import { Chip } from '@mui/material'

export default function ImageSearchChip({ label, onClick }) {
  return (
    <Chip
      label={label}
      onClick={onClick}
      clickable
      variant="outlined"
    />
  )
}