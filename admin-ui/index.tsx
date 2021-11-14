import React from 'react'
import ReactDom from 'react-dom'
import {BrowserRouter, Switch, Route, Redirect, NavLink} from 'react-router-dom'
import styled from 'styled-components'

import { createTheme, ThemeProvider, Theme, StyledEngineProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import NavBar, {NavItems} from '../components/NavBar'
import StatusView from './views/status/Status'
import TestView from './views/tests/Tests'
import DeprecatedTestsView from './views/tests/DeprecatedTestsView'
import NodeView from './views/node/Node'
import SuryaView from './views/surya/Surya'
import AudioView from './views/audio/LatestAudio'

import Stress from './fiddle/Stress'
import Timeline from './fiddle/Timeline'

import NotFound from '../components/404'
import { ProgressProvider } from '../components/progress/ProgressProvider'

import '../assets/styles.scss'



declare module '@mui/styles/defaultTheme' {
  interface DefaultTheme extends Theme {}
}


const theme = createTheme({
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
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true
      },
      styleOverrides: {
        root: {
          textTransform: 'none'
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
        variant: 'outlined'
      }
    }
  }
})


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
                <Redirect exact from="/" to="status" />
                <Route path="/status" component={StatusView} />
                <Route path="/tests/old" component={DeprecatedTestsView} />
                <Route path="/tests" component={TestView} />
                <Route path="/audio" component={AudioView} />
                <Route path="/node/:node" component={NodeView} />
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
