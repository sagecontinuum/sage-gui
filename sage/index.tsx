import React from 'react'
import ReactDom from 'react-dom'
import {BrowserRouter, Switch, Route, Redirect} from 'react-router-dom'
import styled from 'styled-components'

import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'

import NavBar from '../components/NavBar'
import Apps from './views/ecr/Apps'
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
      main: '#056600',
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


const NavMenu = () => <div className="title">My Apps</div>


export default function Sage() {

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      <NavBar Menu={NavMenu} />

      <SnackbarProvider>
        <Container>
          <BrowserRouter basename="/">
            <Switch>
              <Route exact path="/">
                <Redirect to="/apps/my-apps" />
              </Route>
              <Route path="/apps/:view+">
                <Apps />
              </Route>
              <Route path="*">
                <NotFound />
              </Route>
            </Switch>
          </BrowserRouter>
        </Container>
      </SnackbarProvider>
    </ThemeProvider>
  )
}

const Container = styled.div`
  margin: 60px 0 0 0;
  width: 100%;
`


ReactDom.render(<Sage />, document.getElementById('app'))
