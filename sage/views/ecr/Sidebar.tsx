import React from 'react'
import styled from 'styled-components'
import { NavLink} from 'react-router-dom'

import UserIcon from '@material-ui/icons/AccountCircleRounded'
import SharedIcon from '@material-ui/icons/SupervisedUserCircle'
import PublicIcon from '@material-ui/icons/PublicRounded'
import VerifiedIcon from '@material-ui/icons/VerifiedUserRounded'



export default function Sidebar() {
  return (
    <Root>
      <Item to="my-apps"><UserIcon/> My Apps</Item>
      <Item to="shared-with-me"><SharedIcon /> Shared with Me</Item>
      <Item to="public"><PublicIcon /> Public</Item>
      <Item to="certified-apps"><VerifiedIcon /> Certified Apps</Item>
    </Root>
  )
}

const Root = styled.div`
  padding-top: 35px;
  min-width: 200px;
  border-right: 1px solid #ddd;
`

const primaryColor = '#8166a0'
const secondaryColor = '#87baa6'

const Item = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: 10px;
  width: 100%;
  color: #444;

  :hover{
    text-decoration: none;
  }

  :hover:not(.active) {
    color: #000;
  }

  .MuiSvgIcon-root {
    margin-right: 5px;
  }

  &.active {
    border-right: 3px solid ${primaryColor};
    background: rgb(243, 243, 243);
    font-weight: 800;
  }

  &.active .MuiSvgIcon-root {
    color: ${primaryColor};
  }
`

