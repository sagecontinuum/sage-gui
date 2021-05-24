import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import Menu from '@material-ui/core/Menu'
import CaretIcon from '@material-ui/icons/ArrowDropDownRounded'

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


export default function CustomizedMenus(props) {
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

