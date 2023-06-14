import styled from 'styled-components'

import sage from 'url:/assets/sage-drawing.png'
import { version } from '/package.json'


const SageLogo = () =>
  <>
    <LogoImg src={sage} height="35" />
    <Logo title={`Sage: v${version}`}>
        Sage
      <sup>(beta)</sup>
    </Logo>
  </>


export default SageLogo


const AdminLogo = () =>
  <>
    <LogoImg src={sage} height="35" />
    <Logo title="Sage Admin UI">
        Sage
      <sup><span style={{color: '#8166a0'}}>[Admin]</span></sup>
    </Logo>
  </>

export {AdminLogo}


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

  sup {
    position: relative;
    top: -5px;
    font-size: .3em;
    color: #aaa;
  }
`