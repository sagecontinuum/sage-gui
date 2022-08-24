import React from 'react'
import withStyles from '@mui/styles/withStyles'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import CaretIcon from '@mui/icons-material/ArrowDropDownRounded'

const StyledMenu = withStyles({
  paper: {
    border: '1px solid #d3d4d5',
    transition: 'none !important'
  },
})((props) => (
  <Menu
    elevation={0}
    getContentAnchorEl={null}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'center',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'center',
    }}
    {...props}
  />
))


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
    <span>
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
      <StyledMenu
        id="menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        onClick={handleClose}
      >
        {menu}
      </StyledMenu>
    </span>
  )
}

