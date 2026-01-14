import { createTheme, Theme } from '@mui/material/styles'


declare module '@mui/styles/defaultTheme' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}

const theme = createTheme({
  defaultColorScheme: 'light',
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: 'rgb(28, 140, 201)'
        },
        secondary: {
          main: '#8166a0'
        },
        success: {
          main: '#3ac37e'
        }
      }
    },
    dark: {
      palette: {
        primary: {
          main: 'rgb(28, 140, 201)'
        },
        secondary: {
          main: '#8166a0'
        },
        success: {
          main: '#3ac37e'
        },
        background: {
          default: '#121212',
        }
      }
    }
  },
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
  components: {
    MuiCard: {
      defaultProps: {
        variant: 'outlined'
      }
    },
    MuiTabs: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderBottom: `1px solid ${theme.palette.divider}`,
        })
      }
    },
    MuiTab: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontWeight: 500,
          '&:not(.Mui-selected):hover': {
            color: theme.palette.text.primary,
            opacity: 1,
          }
        })
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
    MuiIconButton: {
      defaultProps: {
        disableRipple: true
      }
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
    MuiRadio: {
      defaultProps: {
        size: 'small'
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
