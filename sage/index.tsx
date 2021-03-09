import React from 'react'
import ReactDom from 'react-dom'
import {BrowserRouter, Switch, Route, Redirect} from 'react-router-dom'
import styled from 'styled-components'

import useMediaQuery from '@material-ui/core/useMediaQuery'
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'

import NavBar from '../components/NavBar'
import PluginView from './views/ecr/PluginView'
import NotFound from '../components/404'

import '../assets/styles.scss'


const theme = createMuiTheme({
  typography: {
    fontFamily: [
      'Nunito'
    ].join(','),
    button: {
      textTransform: "none",
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
    }
  },
  transitions: {
    create: () => 'none',
  },
  overrides: {
    MuiButton: {
      text: {
        textTransform: 'none',
      },
    },
  },
})


export default function App() {

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      <NavBar />

      <Container>
        <BrowserRouter>
          <Switch>
            <Route exact path="/">
              <Redirect to="/home" />
            </Route>
            <Route path="/home">
              <PluginView />
            </Route>
            <Route path="*">
              <NotFound />
            </Route>
          </Switch>
        </BrowserRouter>
      </Container>
    </ThemeProvider>
  )
}

const Container = styled.div`
  margin: 70px 10px 10px 10px;
`


ReactDom.render(<App />, document.getElementById('app'))
