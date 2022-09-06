import React from 'react'
import styled from 'styled-components'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import CaretIcon from '@mui/icons-material/ArrowDropDownRounded'



export default function DropdownMenu(props) {
  const {menu, label, caret = true, ...rest} = props

  const [anchorEl, setAnchorEl] = React.useState(null)

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <div>
      <Button
        aria-controls="menu"
        aria-haspopup="true"
        disableRipple
        color="inherit"
        onClick={handleClick}
        {...rest}
      >
        {label} {caret && <CaretIcon/>}
      </Button>
      <Dropdown
        id="menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        onClick={handleClose}
        elevation={0}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        {menu}
      </Dropdown>
    </div>
  )
}


const Dropdown = styled(Menu)`
  z-index: 9001;    // only actually for navbar
  .MuiPaper-root {
    border: 1px solid #d3d4d5;
  }

  .MuiListItemIcon-root {
    color: rgba(0, 0, 0, 0.7);
  }
`
