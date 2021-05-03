import React from 'react'
import styled from 'styled-components'
import sage from 'url:../assets/sage-drawing.png'
import Divider from '@material-ui/core/Divider'
import AccountIcon from '@material-ui/icons/AccountCircleRounded'

import config from '../config'
const {user} = config

type Props = {
  Menu?: React.FC
}

export default function NavBar(props: Props) {
  const { Menu } = props

  return (
    <Root className="flex items-center justify-between">
      <div className="flex items-center">
        <LogoImg src={sage} height="35" />
        <Logo>
          Sage
        </Logo>
        <Divider orientation="vertical" flexItem style={{margin: '5px 0' }} />
        {Menu && <Menu />}
      </div>

      <div className="flex items-center">
        <AccountIcon />&nbsp;{user.username}
      </div>
    </Root>
  )
}

const Root = styled.div`
  flex-shrink: 0;
  position: fixed;
  top: 0;
  width: 100%;
  background: #fff;
  z-index: 1000;
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  box-shadow:  0px 2px 4px -1px rgb(0 0 0 / 0%), 0px 4px 5px 0px rgb(0 0 0 / 0%), 0px 1px 10px 0px rgb(0 0 0 / 12%);

  .title {
    margin: 4px 20px 0 20px;
    font-weight: 600;
  }
`

const LogoImg = styled.img`
  margin-bottom: 2px;
`

const Logo = styled.span`
  font-size: 2.2em;
  font-family: 'Open sans', sans-serif;
  font-weight: 800;
  color: #87baa6;
  margin-bottom: 2px;
  padding-right: 20px;
  padding-left: 2px;
`


