import { createTheme, Theme } from '@mui/material/styles'


declare module '@mui/styles/defaultTheme' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}

const theme = createTheme({
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
    mode: 'light',
    primary: {
      main: 'rgb(28, 140, 201)'
    },
    secondary: {
      main: '#8166a0'
    }
  },
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true
      },
      styleOverrides: {
        root: {
          textTransform: 'none'
        }
      }
    },
    MuiButton: {
      defaultProps: {
        size: 'small'
      },
    },
    MuiSelect: {
      defaultProps: {
        size:'small'
      }
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
        variant: 'outlined'
      }
    }
  }
})


export default theme
