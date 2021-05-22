import React from 'react'
import styled from 'styled-components'
import { NavLink } from 'react-router-dom'

import UserIcon from '@material-ui/icons/AccountCircleRounded'
import SharedIcon from '@material-ui/icons/SupervisedUserCircle'
import PublicIcon from '@material-ui/icons/PublicRounded'



export default function Sidebar() {
  return (
    <Root>
      <Item to="/apps/explore">
        <PublicIcon />
        <div>Explore</div>
      </Item>
      <Item to="/apps/my-apps">
        <UserIcon/>
        <div>My Apps</div>
      </Item>
      <Item to="/apps/shared-with-me">
        <SharedIcon />
        <div>Shared with Me</div>
      </Item>
    </Root>
  )
}

const Root = styled.div`
  padding-top: 18px;
  border-right: 1px solid #ddd;
  background: #f5f5f5;
  max-width: 75px;
`


const primaryColor = 'rgb(28, 140, 201)'
const secondaryColor = '#8166a0'


const Item = styled(NavLink)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 10px;
  width: 100%;
  color: #444;
  font-size: .9em;

  svg {
    font-size: 2.5em;
  }

  :hover{
    text-decoration: none;
  }

  :hover:not(.active) {
    color: #000;
  }

  &.active {
    border-right: 3px solid ${primaryColor};
    border-top: 1px solid #eee;
    border-bottom: 1px solid #eee;
    background: rgb(255, 255, 255);
    font-weight: 800;
  }

  &.active .MuiSvgIcon-root {
    color: ${primaryColor};
  }
`

