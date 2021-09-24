import React from 'react'
import ReactDom from 'react-dom'
import {BrowserRouter, Switch, Route, Redirect, NavLink} from 'react-router-dom'
import styled from 'styled-components'

import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'

import NavBar, {NavItems} from '../components/NavBar'
import StatusView from './views/status/Status'
import TestView from './views/tests/Tests'
// import PluginsView from './views/plugins/Plugins'
import NodeView from './views/node/Node'
import NotFound from '../components/404'
import { ProgressProvider } from '../components/progress/ProgressProvider'

import '../assets/styles.scss'



const theme = createMuiTheme({
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
    type: 'light', // darkMode ? 'dark' : 'light',
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
      margin: 'dense',
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
})


const NavMenu = () =>
  <NavItems>
    <li><NavLink to="/status">Status</NavLink></li>
    <li><NavLink to="/tests">Tests</NavLink></li>
    {/*<li><NavLink to="/plugins">Plugins</NavLink></li>*/}
  </NavItems>



export default function App() {
  return (
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
              <Route path="/plugins">
                <PluginsView />
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
  )
}

const Container = styled.div`
  margin: 60px 10px 10px 10px;
  width: 100%;
`


ReactDom.render(<App />, document.getElementById('app'))
