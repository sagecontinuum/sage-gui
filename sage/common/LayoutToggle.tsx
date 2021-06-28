import React from 'react'
import IconButton from '@material-ui/core/IconButton'
import SpaciousIcon from '@material-ui/icons/ViewStream'
import ViewComfyIcom from '@material-ui/icons/ViewComfy'



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
        style={{color: layout == 'compact' ? '#000' : '#ccc'}}
        size="small"
      >
        <ViewComfyIcom />
      </IconButton>
      <IconButton
        onClick={() => onClick('spacious')}
        style={{color: layout == 'spacious' ? '#000' : '#ccc'}}
        size="small"
      >
        <SpaciousIcon />
      </IconButton>
    </div>
  )
}
