import React from 'react'
import ReactDom from 'react-dom'
import {BrowserRouter, Switch, Route, Redirect, NavLink} from 'react-router-dom'
import styled from 'styled-components'

import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'

import NavBar, {NavItems} from '../components/NavBar'
import DataSearch from './data/DataSearch'
import DataProduct from './data/DataProduct'
import Apps from './ecr/Apps'
import Docs from './docs/Page'
import TestSignIn from './sign-in/TestSignIn'
import NotFound from '../components/404'

import { ProgressProvider } from '../components/progress/ProgressProvider'
import { SnackbarProvider } from 'notistack'

import '../assets/styles.scss'
// import Alert from '@material-ui/lab/Alert'


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
    <li><NavLink to="/apps">Edge Apps</NavLink></li>
    {/*<li><NavLink to="/data">Data</NavLink></li>*/}
  </NavItems>



export default function Sage() {

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>

      <BrowserRouter>
        <NavBar Menu={NavMenu} hasSignIn />

        <SnackbarProvider autoHideDuration={3000} preventDuplicate maxSnack={2}>
          <Container>
            <ProgressProvider>
              {/*
              <Alert severity="warning" style={{borderBottom: '1px solid #ddd' }}>
                Our team is currently doing maintenance on this application.
              </Alert>
              */}
              <Switch>
                <Route exact path="/">
                  <Redirect to="/apps/explore" />
                </Route>
                <Route exact path="/apps">
                  <Redirect to="/apps/explore" />
                </Route>
                <Route exact path="/login">
                  <TestSignIn />
                </Route>

                <Route path="/apps" component={Apps} />
                <Route exact path="/data" component={DataSearch} />
                <Route path="/data/product/:name" component={DataProduct} />
                <Route path="/docs/:page" component={Docs} />
                <Route path="*" component={NotFound} />
              </Switch>
            </ProgressProvider>
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
