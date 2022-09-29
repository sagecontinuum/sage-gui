
import { useState, useRef } from 'react'
import { NavLink, useMatch } from 'react-router-dom'
import styled from 'styled-components'

import CaretIcon from '@mui/icons-material/ArrowDropDownRounded'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'

import useClickOutside from '/components/hooks/useClickOutside'


type Props = {
  label: string
  root: string
  menu: JSX.Element
}

export default function NavItem(props: Props) {
  const {label, root, menu} = props

  const ref = useRef()
  const path = useMatch('*').pathname

  const [open, setOpen] = useState(false)

  useClickOutside(ref, () => setOpen(false), [])

  const handleClick = () => {
    setOpen(prev => !prev)
  }

  const isActive = path.includes(root)

  return (
    <Root ref={ref} className="flex items-center">
      <a onClick={handleClick} className={`flex ${isActive ? 'active' : ''}`}>
        {label} {menu && <CaretIcon />}
      </a>
      {open && menu &&
        <MenuContainer onClick={handleClick}>
          {menu}
        </MenuContainer>
      }
    </Root>
  )
}

const Root = styled.div`
  position: relative;
  margin: 0 0 0 20px;

  > a {
    padding: 20px 0;
    user-select: none;
    z-index: 9999;
    color: #000;
    text-decoration: none;
  }

  > a:not(.active) {
    opacity: .6;
  }

  > a:not(.active):hover {
    opacity: 1.0;
  }

  > a.active {
    opacity: 1.0;
    height: 100%;
  }

  /* active item dot effect */
  > a:after {
    content: '';
    position: absolute;
    height: 0;
  }

  > a.active:after {
    transition: height .2s ease;
    content: '';
    position: absolute;
    width: 16px;
    height: 8px;
    bottom: 0;
    left: calc(50% - 20px);
    background: rgb(28, 140, 201);
    border-radius: 15px 15px 0 0;
  }

  .MuiMenuItem-root,
  .MuiMenuItem-root svg {
    color: #444;
  }
  .MuiMenuItem-root.active,
  .MuiMenuItem-root.active svg {
    color: rgb(28, 140, 201);
  }
`

const MenuContainer = styled.div`
  position: absolute;
  top: 59px;
  left: -40px;
  background: #fff;
  box-shadow: 0px 5px 5px rgba(0, 0, 0, .05);
  border: solid #ccc;
  border-width: 0 1px 1px 1px;
`


type ItemProps = {
  label: string
  icon: JSX.Element
  to: string
}

export function Item(props: ItemProps) {
  const {label, icon, to} = props

  return (
    <MenuItem component={NavLink} to={to}>
      <ListItemIcon>{icon}</ListItemIcon>
      {label}
    </MenuItem>
  )
}
