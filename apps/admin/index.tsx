import ReactDom from 'react-dom'
import {BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import styled from 'styled-components'

import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import NavBar, { NavItems, NavItem } from '/components/nav-bar/NavBar'
import StatusView from './views/status/Status'
import TestView from './views/tests/Tests'
import NodeView from './views/node/Node'
import SuryaStatus from './views/surya/SuryaStatus'
import AudioView from './views/audio/LatestAudio'

import Stress from './fiddle/Stress'
import Timeline from './fiddle/Timeline'

import NotFound from '/components/404'
import { ProgressProvider } from '/components/progress/ProgressProvider'

import theme from '/components/theme'
import '/assets/styles.scss'



const NavMenu = () =>
  <NavItems>
    <NavItem label="Status" to="/status" />
    <NavItem label="Tests" to="/tests" />
    <NavItem label="Factory" to="/surya" />
  </NavItems>



export default function App() {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <CssBaseline/>
          <NavBar menu={<NavMenu />} />

          <Container>
            <ProgressProvider>
              <Routes>
                <Route path="/" element={<Navigate to="status" replace />} />

                <Route path="status" element={<StatusView/>} />
                <Route path="tests" element={<TestView />} />
                <Route path="audio" element={<AudioView />} />
                <Route path="node/:node" element={<NodeView />} />

                <Route path="surya" element={<Navigate to="/surya/phase2" replace />} />
                <Route path="surya/:phase" element={<SuryaStatus />} />

                <Route path="fiddle/stress" element={<Stress/>} />
                <Route path="fiddle/timeline" element={<Timeline />} />
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


ReactDom.render(<App />, document.getElementById('app'))
