import { ThemeProvider } from '@mui/material/styles'
import theme from '/components/theme'

export default function MockTheme({ children }: any) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}

