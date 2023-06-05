
import { useState, useRef, ElementType } from 'react'
import { NavLink, useMatch, useLocation } from 'react-router-dom'
import styled from 'styled-components'

import CaretIcon from '@mui/icons-material/ArrowDropDownRounded'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListSubheader from '@mui/material/ListSubheader'

import useClickOutside from '/components/hooks/useClickOutside'

export { ListSubheader }

type Props = {
  label: string | JSX.Element
  menu?: JSX.Element
  to?: string
  root?: string
  style?: object // menu styling
  href?: string  // use href for external link
}

export default function NavItem(props: Props) {
  const {label, menu, to, root} = props

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
      {to &&
        <NavLink to={to}>
          {label}
        </NavLink>
      }
      {menu &&
        <a onClick={handleClick} className={`flex ${isActive ? 'active' : ''}`}>
          {label} {menu && <CaretIcon />}
        </a>
      }
      {props.href &&
        <a href={props.href}>{label}</a>
      }
      {open && menu &&
        <MenuContainer onClick={handleClick} style={props.style}>
          {menu}
        </MenuContainer>
      }
    </Root>
  )
}

const Root = styled.div`
  position: relative;
  margin: 0 15px;

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
  }

  /* active item dot effect */
  > a:after {
    content: '';
    position: absolute;
    height: 0;
  }

  > a.active:after {
    transition: height .2s ease;

    width: 16px;
    height: 8px;
    bottom: 0;
    left: 35%;
    background: rgb(28, 140, 201);
    border-radius: 15px 15px 0 0;
  }

  .MuiMenuItem-root,
  .MuiMenuItem-root svg {
    color: #444;
  }

  .MuiMenuItem-root:after {
    content: '';
    position: absolute;
    height: 0;
  }

  .MuiMenuItem-root.active:after {
    width: 8px;
    height: 16px;
    left: 0;
    background: rgb(28, 140, 201);
    border-radius: 0px 15px 15px 0;
  }
`

const MenuContainer = styled.div`
  position: absolute;
  top: 59px;
  left: -50px;
  background: #fff;
  box-shadow: 0px 5px 5px rgba(0, 0, 0, .05);
  border: solid #ccc;
  border-width: 0 1px 1px 1px;
`


type ItemProps = {
  label: string | JSX.Element
  to?: string
  icon?: JSX.Element
  onClick?: MouseEvent
  component?: string | JSX.Element
  href?: string
  target?: string
}

export function Item(props: ItemProps) {
  const { pathname, search } = useLocation()

  const isActive = search.length ? (
    props.to.includes(pathname) &&
    props.to.includes(decodeURIComponent(search))
  ) : props.to == pathname

  return (
    <MenuItem
      component={props.component || NavLink}
      className={`flex ${isActive ? 'active' : ''}`}
      {...props}
    >
      <ListItemIcon>{props.icon}</ListItemIcon>
      {props.label}
    </MenuItem>
  )
}

