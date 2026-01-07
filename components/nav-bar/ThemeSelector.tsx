import { useState } from 'react'
import {
  IconButton, Tooltip, useColorScheme,
  Menu, ToggleButtonGroup, ToggleButton
} from '@mui/material'
import {
  Brightness4, DarkModeOutlined, LightModeOutlined
} from '@mui/icons-material'


export default function ThemeSelector() {
  const {mode, setMode} = useColorScheme()
  const [themeAnchor, setThemeAnchor] = useState<null | HTMLElement>(null)

  return (
    <>
      <Tooltip title={
        themeAnchor ? '' :
          <div className="text-center">
            Using {mode} color theme<br/>Click to change
          </div>
      }>
        <IconButton
          onClick={(e) => setThemeAnchor(e.currentTarget)}
        >
          {mode === 'light' && <LightModeOutlined fontSize="small" />}
          {mode === 'dark' && <DarkModeOutlined fontSize="small" />}
          {mode === 'system' && <Brightness4 fontSize="small" />}
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={themeAnchor}
        open={Boolean(themeAnchor)}
        onClose={() => setThemeAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <div style={{ padding: '8px' }}>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(e, newMode) => {
              if (newMode !== null) {
                setMode(newMode)
                setThemeAnchor(null)
              }
            }}
            size="small"
            orientation="vertical"
            fullWidth
            sx={{minWidth: 150}}
          >
            <ToggleButton value="light">
              <LightModeOutlined fontSize="small" sx={{ mr: 1 }} />
              Light
            </ToggleButton>
            <ToggleButton value="dark">
              <DarkModeOutlined fontSize="small" sx={{ mr: 1 }} />
              Dark
            </ToggleButton>
            <ToggleButton value="system">
              <Brightness4 fontSize="small" sx={{ mr: 1 }} />
              System
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      </Menu>
    </>
  )
}
