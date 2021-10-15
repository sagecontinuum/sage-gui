import React from 'react'
import ReactDom from 'react-dom'
import {BrowserRouter, Switch, Route, Redirect, NavLink} from 'react-router-dom'
import styled from 'styled-components'

import { createTheme, ThemeProvider, Theme, StyledEngineProvider, adaptV4Theme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import NavBar, {NavItems} from '../components/NavBar'
import StatusView from './views/status/Status'
import TestView from './views/tests/Tests'
import NodeView from './views/node/Node'
import SuryaView from './views/surya/Surya'
import AudioView from './views/audio/LatestAudio'
import StressView from './views/stress/Stress'

import NotFound from '../components/404'
import { ProgressProvider } from '../components/progress/ProgressProvider'

import '../assets/styles.scss'



declare module '@mui/styles/defaultTheme' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}


const theme = createTheme(adaptV4Theme({
  typography: {
    fontFamily: [
      'Roboto'
    ].join(','),
    button: {
      textTransform: 'none',
      fontWeight: 800
    }
  },
  palette: {
    mode: 'light',
    primary: {
      main: 'rgb(28, 140, 201)'
    },
    secondary: {
      main: '#8166a0'
    }
  },
  props: {
    MuiButtonBase: {
      disableRipple: true,
    },
    MuiTextField: {
      size: 'small',
      variant: 'outlined'
    }
  },
  transitions: {
  },
  overrides: {
    MuiButton: {
      text: {
        textTransform: 'none',
      },
    },
    MuiTooltip: {
      tooltip: {
        fontSize: '.8em'
      }
    }
  },
}))


const NavMenu = () =>
  <NavItems>
    <li><NavLink to="/status">Status</NavLink></li>
    <li><NavLink to="/tests">Tests</NavLink></li>
    {/*<li><NavLink to="/surya">Surya</NavLink></li>*/}
    {/*<li><NavLink to="/plugins">Plugins</NavLink></li>*/}
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
                <Route exact path="/">
                  <Redirect to="/status" />
                </Route>
                <Route path="/status">
                  <StatusView />
                </Route>
                <Route path="/tests">
                  <TestView />
                </Route>
                {/*<Route path="/surya">
                  <SuryaView />
                </Route>*/}
                <Route path="/audio">
                  <AudioView />
                </Route>
                <Route path="/stress">
                  <StressView />
                </Route>
                <Route path="/node/:node">
                  <NodeView />
                </Route>
                <Route path="*">
                  <NotFound />
                </Route>
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
