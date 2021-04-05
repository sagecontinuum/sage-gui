import React from 'react'
import ReactDom from 'react-dom'
import {BrowserRouter, Switch, Route, Redirect, Link} from 'react-router-dom'
import styled from 'styled-components'

import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'

import NavBar from '../components/NavBar'
import Apps from './ecr/Apps'
import TestSignIn from './sign-in/TestSignIn'
import NotFound from '../components/404'

import { SnackbarProvider } from 'notistack'

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
      main: '#8166a0',
    },
    secondary: {
      main: '#24a08a' //'#056600',
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
  },
})


const NavMenu = () =>
  <div className="title">
    <Link to="/apps/certified-apps" className="nav-link">
      Edge Apps
    </Link>
  </div>



export default function Sage() {

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>

      <BrowserRouter basename="/">
        <NavBar Menu={NavMenu} />

        <SnackbarProvider>
          <Container>

            <Switch>
              <Route exact path="/">
                <Redirect to="/apps/certified-apps" />
              </Route>
              <Route exact path="/login">
                <TestSignIn />
              </Route>

              <Route path="/apps">
                <Apps />
              </Route>
              <Route path="*">
                <NotFound />
              </Route>
            </Switch>
          </Container>
        </SnackbarProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

const Container = styled.div`
  margin: 60px 0 0 0;
  width: 100%;
`


ReactDom.render(<Sage />, document.getElementById('app'))
