import React from 'react'
import ReactDom from 'react-dom'

import useMediaQuery from '@material-ui/core/useMediaQuery'
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'


import NavBar from './NavBar
import Overview from './views/status/StatusView'

import './assets/styles.scss'



function App() {
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
      <NavBar />

      <Overview />
    </ThemeProvider>
  )
}






ReactDom.render(<App />, document.getElementById('app'))