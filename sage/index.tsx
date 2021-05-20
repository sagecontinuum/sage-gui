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
    <Link to="/apps/explore" className="nav-link">
      Edge Apps
    </Link>
  </div>



export default function Sage() {

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>

      <BrowserRouter>
        <NavBar Menu={NavMenu} hasSignIn />

        <SnackbarProvider autoHideDuration={3000} preventDuplicate maxSnack={2}>
          <Container>

            <Switch>
              <Route exact path="/">
                <Redirect to="/apps/explore" />
              </Route>
              <Route exact path="/login">
                <TestSignIn />
              </Route>

              <Route path="/apps" component={Apps} />
              <Route path="*" component={NotFound} />
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
