import React from 'react'
import styled from 'styled-components'


type Props = {

}

const NavBar = (props: Props) => {


  return (
    <Root>
      <Logo>Sage</Logo>
      <Title>Admin Dash</Title>
    </Root>
  )
}

const Root = styled.div`
  height: 50px;
  border-bottom: 3px solid #ccc;
`

const Logo = styled.span`
  font-size: 2em;
  font-family: 'Open Sans', sans-serif;
  font-weight: 800;
  color: #889b77;
  padding: 20;
`

const Divider = styled.span`
  font-size: 2em;
  color: #7c7c7c;
`

const Title = styled.span`
  margin-left: 20px;
`

export default NavBar
