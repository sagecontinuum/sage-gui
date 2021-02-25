import React from 'react'
import styled from 'styled-components'
import sage from 'url:./assets/sage-drawing.png'
import Divider from '@material-ui/core/Divider'


export default function NavBar() {

  return (
    <Root>
      <LogoImg src={sage} height="35" />
      <Logo>
        Sage
      </Logo>
      <Divider orientation="vertical" flexItem style={{margin: '10px 0' }} />
      <Title>Admin Dash</Title>
    </Root>
  )
}

const Root = styled.div`
  position: fixed;
  top: 0;
  width: 100%;
  background: #fff;
  z-index: 9999;
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  box-shadow:  0px 2px 4px -1px rgb(0 0 0 / 0%), 0px 4px 5px 0px rgb(0 0 0 / 0%), 0px 1px 10px 0px rgb(0 0 0 / 12%);
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

const Title = styled.span`
  margin-top: 11px;
  margin-left: 20px;
  font-weight: 600;
`

