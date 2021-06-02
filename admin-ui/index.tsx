import React from 'react'
import ReactDom from 'react-dom'
import {BrowserRouter, Switch, Route, Redirect} from 'react-router-dom'
import styled from 'styled-components'

import useMediaQuery from '@material-ui/core/useMediaQuery'
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'

import NavBar from '../components/NavBar'
import StatusView from './views/status/StatusView'
import NodeView from './views/node'
import NotFound from '../components/404'
import { ProgressProvider } from '../components/progress/ProgressProvider'

import '../assets/styles.scss'

// import {version} from '../package.json'


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
  <div className="title">
    Admin <small className="muted">{/*version placeholder*/}</small>
  </div>



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
  padding-top: 10px;
  margin: 60px 10px 10px 10px;
  width: 100%;
`


ReactDom.render(<App />, document.getElementById('app'))
