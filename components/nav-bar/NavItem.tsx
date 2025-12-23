
import { useRef } from 'react'
import { NavLink, useMatch, useLocation } from 'react-router-dom'
import styled from 'styled-components'

import CaretIcon from '@mui/icons-material/ArrowDropDownRounded'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListSubheader from '@mui/material/ListSubheader'

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

  const isActive = path.includes(root)

  return (
    <Root ref={ref} className="flex items-center">
      {to &&
        <NavLink to={to} className={`flex ${isActive ? 'active' : ''}`}>
          {label} {menu && <CaretIcon />}
        </NavLink>
      }
      {menu && !to &&
        <a className={`flex ${isActive ? 'active' : ''}`}>
          {label} {menu && <CaretIcon />}
        </a>
      }
      {props.href &&
        <a href={props.href}>{label}</a>
      }
      {menu &&
        <MenuContainer style={props.style}>
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
  left: 50%;
  transform: translateX(-50%) translateY(-10px);
  min-width: 150px;
  background: #fff;
  box-shadow: 0px 5px 5px rgba(0, 0, 0, .05);
  border: solid #ccc;
  border-width: 0 1px 1px 1px;
  z-index: 8999;

  /* Hidden by default */
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease-out, transform 0.2s ease-out;

  /* Show on hover */
  ${Root}:hover & {
    opacity: 1;
    pointer-events: auto;
    transform: translateX(-50%) translateY(0);
  }
`


type ItemProps = {
  label: string | JSX.Element
  to?: string
  icon?: JSX.Element
  onClick?: (evt: React.MouseEvent) => void
  component?: string | JSX.Element
  href?: string
  target?: string
}

export function Item(props: ItemProps) {
  const { pathname, search } = useLocation()

  let isActive
  if (props.to) {
    isActive = search.length ? (
      props.to.includes(pathname) &&
      props.to.includes(decodeURIComponent(search))
    ) : props.to == pathname
  }

  return (
    // @ts-ignore; custom component props mismatch; todo
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