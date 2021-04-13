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

import '../assets/styles.scss'


const NavMenu = () => <div className="title">Admin</div>


export default function App() {
  const darkMode = useMediaQuery('(prefers-color-scheme: dark)')

  const theme = React.useMemo(
    () =>
      createMuiTheme({
        typography: {
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
            main: 'rgb(28, 140, 201)',
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
      }),
    [darkMode]
  )


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      <NavBar Menu={NavMenu} />

      <Container>
        <BrowserRouter>
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
        </BrowserRouter>
      </Container>
    </ThemeProvider>
  )
}

const Container = styled.div`
  margin: 70px 10px 10px 10px;
  width: 100%;
`


ReactDom.render(<App />, document.getElementById('app'))
