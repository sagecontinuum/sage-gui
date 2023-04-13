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
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1750,
    },
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
    MuiCard: {
      defaultProps: {
        variant: 'outlined'
      }
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #e8e8e8',
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          '&:not(.Mui-selected):hover': {
            color: '#222',
            opacity: 1,
          }
        }
      }
    },
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
    MuiToggleButtonGroup: {
      defaultProps: {
        size: 'small'
      }
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
    },
    MuiOutlinedInput: {
      defaultProps: {
        size: 'small',
      }
    },
    MuiChip: {
      defaultProps: {
        size: 'small',
        variant: 'outlined'
      }
    },
    MuiMenu: {
      defaultProps: {
        transitionDuration: 50
      }
    },
    MuiIcon: {
      defaultProps: {
        baseClassName: 'material-icons-rounded',
      }
    }
  }
})


export default theme
