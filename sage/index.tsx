import React from 'react'
import ReactDom from 'react-dom'
import {BrowserRouter, Switch, Route, Redirect} from 'react-router-dom'
import styled from 'styled-components'

import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'

import NavBar from '../components/NavBar'
import AppList from './views/ecr/AppList'
import CreateApp from './views/ecr/CreateApp'
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


const NavMenu = () => <div className="title">Apps</div>


export default function App() {

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      <NavBar Menu={NavMenu} />

      <Container>
        <BrowserRouter basename="/">
          <Switch>
            <Route exact path="/">
              <Redirect to="/apps" />
            </Route>
            <Route path="/apps">
              <AppList />
            </Route>
            <Route path="/apps/create-app">
              <CreateApp />
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
