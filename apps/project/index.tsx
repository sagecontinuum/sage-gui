import ReactDom from 'react-dom'
import {BrowserRouter, Routes, Route, Navigate, NavLink} from 'react-router-dom'
import styled from 'styled-components'

import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import NavBar, {NavItems} from '/components/NavBar'
import Links from './views/DataLinks'
import Nodes from './views/nodes/Nodes'
import Node from '../common/node/Node'

import NotFound from '/components/404'
import { ProgressProvider } from '/components/progress/ProgressProvider'

import theme from '/components/theme'
import '/assets/styles.scss'
import settings from './settings'



const NavMenu = () =>
  <NavItems>
    <li><NavLink to="nodes">Nodes</NavLink></li>
    <li><NavLink to="data-links">Data</NavLink></li>
  </NavItems>


const LogoPlaceHolder = () =>
  <Logo>{settings.logo || settings.project || settings.focus}</Logo>



export default function App() {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <CssBaseline/>
          <NavBar
            logo={<LogoPlaceHolder/>}
            menu={<NavMenu />}
            hasDocsLink
          />

          <Container>
            <ProgressProvider>
              <Routes>
                <Route path="/" element={<Navigate to="nodes" replace />} />

                <Route path="nodes" element={<Nodes/>} />
                <Route path="data-links" element={<Links/>} />
                <Route path="node/:node" element={<Node />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </ProgressProvider>
          </Container>
        </BrowserRouter>
      </ThemeProvider>
    </StyledEngineProvider>
  )
}

const Container = styled.div`
  margin: 60px 10px 10px 10px;
  width: 100%;
`

const Logo = styled.span`
  font-size: 2.2em;
  font-family: 'Open sans', sans-serif;
  font-weight: 800;
  color: #666;
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

ReactDom.render(<App />, document.getElementById('app'))
