import React from 'react'
import ReactDom from 'react-dom'
import {BrowserRouter, Switch, Route, Redirect} from 'react-router-dom'

import useMediaQuery from '@material-ui/core/useMediaQuery'
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'

import NavBar from './NavBar'
import Dashboard from './views/status/Dashboard'

import './assets/styles.scss'



export default function App() {
  const darkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = React.useMemo(
    () =>
      createMuiTheme({
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
         },
        },
        overrides: {
          MuiButton: {
            text: {
              textTransform: 'none',
            },
          },
        },
      }),
    [darkMode]
  )


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>

      <BrowserRouter>
        <NavBar />

        <Switch>
          <Route exact path="/">
            <Redirect to="/status" />
          </Route>
          <Route path="/status">
            <Dashboard />
          </Route>
        </Switch>
      </BrowserRouter>
    </ThemeProvider>
  )
}


ReactDom.render(<App />, document.getElementById('app'))
