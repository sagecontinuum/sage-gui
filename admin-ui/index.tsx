import ReactDom from 'react-dom'
import {BrowserRouter, Switch, Route, Redirect, NavLink} from 'react-router-dom'
import styled from 'styled-components'

import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import NavBar, {NavItems} from '../components/NavBar'
import StatusView from './views/status/Status'
import TestView from './views/tests/Tests'
import NodeView from './views/node/Node'
import SuryaView from './views/surya/Surya'
import AudioView from './views/audio/LatestAudio'

import Stress from './fiddle/Stress'
import Timeline from './fiddle/Timeline'

import Divider from '@mui/material/Divider'
import NotFound from '../components/404'
import { ProgressProvider } from '../components/progress/ProgressProvider'

import theme from '../components/theme'
import '../assets/styles.scss'



const NavMenu = () =>
  <NavItems>
    <li><NavLink to="/status">Status</NavLink></li>
    <li><NavLink to="/tests">Tests</NavLink></li>
    <Divider orientation="vertical" flexItem style={{margin: '0 10px' }} />
    <li><NavLink to="/surya">Factory</NavLink></li>
  </NavItems>



export default function App() {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <CssBaseline/>
          <NavBar Menu={NavMenu} />

          <Container>
            <ProgressProvider>
              <Switch>
                <Redirect exact from="/" to="status" />
                <Route path="/status" component={StatusView} />
                <Route path="/tests" component={TestView} />
                <Route path="/audio" component={AudioView} />
                <Route path="/node/:node" component={NodeView} />

                <Redirect exact from="/surya" to="/surya/phase2" />
                <Route path="/surya/:phase" component={SuryaView } />

                <Route path="/fiddle/stress" component={Stress} />
                <Route path="/fiddle/timeline" component={Timeline} />
                <Route path="*" component={NotFound} />
              </Switch>
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
