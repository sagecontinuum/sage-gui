import React from 'react'
import ReactDom from 'react-dom'

import useMediaQuery from '@material-ui/core/useMediaQuery'
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'


import NavBar from '../components/NavBar'
import Overview from './views/StatusView'

import './assets/styles.scss'



function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = React.useMemo(
    () =>
      createMuiTheme({
        typography: {
          fontFamily: [
            'Nunito'
          ].join(','),
          body1: {
            fontWeight: 800,
          },
        },
        palette: {
          type: 'light', //prefersDarkMode ? 'dark' : 'light',
          primary: {
            main: '#9e7dc4',
          },
          secondary: {
            main: '#056600',
          }
        },
        props: {
          MuiButtonBase: {
            disableRipple: true, // No more ripple, on the whole application 💣!
          }
        }
      }),
    [prefersDarkMode],
  )


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      <NavBar />

      <Overview />
    </ThemeProvider>
  )
}






ReactDom.render(<App />, document.getElementById('app'))