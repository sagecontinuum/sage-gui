import React from 'react'
import styled from 'styled-components'
import flower from 'url:../admin-ui/assets/sage-drawing.png'
import Divider from '@material-ui/core/Divider'

type Props = {

}

const NavBar = (props: Props) => {


  return (
    <Root>
      <img src={flower} height="35"/>
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

const Logo = styled.span`
  font-size: 2em;
  font-family: 'Open sans', sans-serif;
  font-weight: 800;
  color: #87baa6; //#48771f; // #889b77;
  padding-right: 20px;
  padding-left: 2px;

  //background: linear-gradient(to right,#c2a5e4,  #7e67a4, #c2a5e4);  /* fallback for old browsers */
  //-webkit-background-clip: text;
  // -webkit-text-fill-color: transparent;
`

const Title = styled.span`
  margin-left: 20px;
  font-weight: 400;
`

export default NavBar
