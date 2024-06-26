import { cloneElement, useState } from 'react'
import IconButton from '@material-ui/core/IconButton'

import Menu from '@material-ui/core/Menu'



type Props = {
  button?: JSX.Element
  children: JSX.Element | JSX.Element[]
}

export default function MenuComponent(props: Props) {
  const {
    button
  } = props

  const [anchorEl, setAnchorEl] = useState(null)

  const handleClick = (evt) => {
    setAnchorEl(evt.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <div>
      {button ? cloneElement(button, {onClick: handleClick})  :
        <IconButton
          aria-controls="menu"
          aria-haspopup="true"
          onClick={handleClick}
          disableRipple
        >
          Menu
        </IconButton>
      }
      <Menu
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorEl={anchorEl}
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {props.children}
      </Menu>
    </div>
  )
}