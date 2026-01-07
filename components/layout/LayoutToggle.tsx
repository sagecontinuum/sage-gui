import IconButton from '@mui/material/IconButton'
import SpaciousIcon from '@mui/icons-material/ViewStream'
import ViewComfyIcon from '@mui/icons-material/ViewComfy'


type Layout = 'compact' | 'spacious'

type LayoutToggleProps = {
  layout: Layout
  onClick: (layout: Layout) => void
}

export default function LayoutToggle(props: LayoutToggleProps) {
  const {layout, onClick} = props

  return (
    <div className="flex">
      <IconButton
        onClick={() => onClick('compact')}
        sx={{
          color: layout === 'compact' ? 'text.primary' : 'text.disabled'
        }}
        size="small"
      >
        <ViewComfyIcon />
      </IconButton>
      <IconButton
        onClick={() => onClick('spacious')}
        sx={{
          color: layout === 'spacious' ? 'text.primary' : 'text.disabled'
        }}
        size="small"
      >
        <SpaciousIcon />
      </IconButton>
    </div>
  )
}
