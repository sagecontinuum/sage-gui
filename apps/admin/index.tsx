import ReactDom from 'react-dom'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import styled from 'styled-components'

import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import { AdminLogo } from '/components/nav-bar/SageLogo'
import NavBar, { NavItems, NavItem } from '/components/nav-bar/NavBar'
import NodeTabs from '/components/views/nodes/NodeTabs'
import Status from './views/status/Status'
import Tests from './views/tests/Tests'
import Node from './views/node/Node'
import SuryaStatus from './views/factory/Factory'
import Audio from './views/audio/LatestAudio'

import Timeline from './fiddle/TimelineFiddle'

import NotFound from '/components/404'
import { ProgressProvider } from '/components/progress/ProgressProvider'

import theme from '/components/theme'
import '/assets/styles.scss'

import config from '/config'


const NavMenu = () =>
  <NavItems>
    <NavItem label="Nodes" to="/nodes?phase=deployed" />
    <NavItem label="Tests" to="/tests?phase=deployed" />
    <NavItem label="Factory" to="/surya" />
  </NavItems>


const isDev = () : boolean =>
  process.env.NODE_ENV == 'development'


export default function App() {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <CssBaseline/>
          <NavBar
            menu={<NavMenu />}
            logo={
              <a href={isDev() ? '/' : config.home} className="no-style flex items-center">
                <AdminLogo />
              </a>
            }
          />

          <Container>
            <ProgressProvider>
              <Routes>
                <Route path="/" element={<Navigate to="nodes?phase=deployed" replace />} />

                <Route path="/" element={<NodeTabs includeSensors={false} isAdmin />}>
                  <Route path="nodes" element={<Status />} />
                  <Route path="tests" element={<Tests />} />
                </Route>

                <Route path="audio" element={<Audio />} />
                <Route path="node/:vsn" element={<Node />} />

                <Route path="surya" element={<Navigate to="/surya/phase2" replace />} />
                <Route path="surya/:phase" element={<SuryaStatus />} />

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
  margin: 60px 0;
  width: 100%;
`


ReactDom.render(<App />, document.getElementById('app'))
