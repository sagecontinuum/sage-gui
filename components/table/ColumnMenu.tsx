// @ts-nocheck: ignore for mui/styles theme typing issues (mui/styles is deprecated)
import React, { useState } from 'react'
import { useTheme, alpha } from '@mui/material/styles'
import makeStyles from '@mui/styles/makeStyles'
import Popper from '@mui/material/Popper'
import SettingsIcon from '@mui/icons-material/SettingsOutlined'
import DoneIcon from '@mui/icons-material/Done'

import Autocomplete from '@mui/material/Autocomplete'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import Tooltip from '@mui/material/Tooltip'

import Box from '@mui/material/Box'


/* example options
const options = [
  { id: 'foo', label: 'Foo' },
  { id: 'bar', label: 'Bar' },
]
*/

const useStyles = makeStyles((theme) => ({
  popper: {
    border: '1px solid rgba(27,31,35,.15)',
    boxShadow: '0 3px 12px rgba(27,31,35,.15)',
    borderRadius: 3,
    width: 300,
    zIndex: 100,
    fontSize: 13,
    color: '#586069',
    backgroundColor: '#f6f8fa'
  },
  header: {
    borderBottom: '1px solid #e1e4e8',
    padding: '8px 10px',
    fontWeight: 600,
  },
  inputBase: {
    padding: 10,
    width: '100%',
    borderBottom: '1px solid #dfe2e5',
    '& input': {
      borderRadius: 4,
      backgroundColor: theme.palette.common.white,
      padding: 8,
      transition: theme.transitions.create(['border-color', 'box-shadow']),
      border: '1px solid #ced4da',
      fontSize: 14,
      '&:focus': {
        boxShadow: `${alpha(theme.palette.primary.main, 0.25)} 0 0 0 0.2rem`,
        borderColor: theme.palette.primary.main,
      },
    },
  },
  paper: {
    boxShadow: 'none',
    margin: 0,
    color: '#586069',
    fontSize: 13
  },
  option: {
    minHeight: 'auto',
    alignItems: 'flex-start',
    padding: 8,
    '&[aria-selected="true"]': {
      backgroundColor: 'transparent',
    },
    '&[data-focus="true"]': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  popperDisablePortal: {
    position: 'relative',
  },
  iconSelected: {
    width: 17,
    height: 17,
    marginRight: 5,
    marginLeft: -2,
  },
  color: {
    width: 14,
    height: 14,
    flexShrink: 0,
    borderRadius: 3,
    marginRight: 8,
    marginTop: 2,
  },
  text: {
    flexGrow: 1,
  },
  close: {
    opacity: 0.6,
    width: 18,
    height: 18,
  },
}))

// todo(nc): figure out what is happening with typing here.
type Option = {
  id?: string
  label?: string
  hide?: boolean
  type?: string
}

type Props = {
  options: Option[]
  ButtonComponent?: JSX.Element
  header?: boolean
  headerText?: string
  noOptionsText?: string
  onChange: (opt: (string | Option)[]) => void
}

export default function ColumnMenu(props: Props) {
  const {
    options,
    onChange,
    ButtonComponent,
    header = true,
    headerText,
    ...rest
  } = props

  const classes = useStyles()
  const [anchorEl, setAnchorEl] = useState(null)
  const theme = useTheme()

  const [value, setValue] = useState(options.filter(obj => !obj.hide))

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = (event, reason) => {
    if (reason === 'toggleInput') {
      return
    }

    // setValue(pendingValue)
    if (anchorEl) {
      anchorEl.focus()
    }
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)
  const id = open ? 'column-search' : undefined

  return (
    <div>
      {ButtonComponent ?
        React.cloneElement(ButtonComponent, {onClick: handleClick}) :
        <Tooltip title="Show/hide columns" placement="top">
          <IconButton
            size="small"
            onClick={handleClick}
            disableRipple
          >
            <SettingsIcon  />
          </IconButton>
        </Tooltip>
      }

      <Popper
        id={id}
        open={open}
        anchorEl={anchorEl}
        placement="bottom-start"
        className={classes.popper}
      >
        {header &&
          <div className={classes.header}>
            {headerText ? headerText : 'Show/hide columns'}
          </div>
        }
        <Autocomplete
          open
          onClose={handleClose}
          multiple
          classes={{
            paper: classes.paper,
            option: classes.option,
            popperDisablePortal: classes.popperDisablePortal,
          }}
          value={value}
          onChange={(event, newValue) => {
            setValue(newValue)
            onChange(newValue)
          }}
          disableCloseOnSelect
          disablePortal
          renderTags={() => null}
          noOptionsText="No labels"
          renderOption={(props, option, { selected }) => {
            return (
              <li {...props}>
                <Box
                  component={DoneIcon}
                  sx={{ width: 17, height: 17, mr: '5px', ml: '-2px' }}
                  style={{
                    visibility: selected ? 'visible' : 'hidden',
                  }}
                />

                <Box
                  sx={{
                    flexGrow: 1,
                    '& span': {
                      color:
                      theme.palette.mode === 'light' ? '#586069' : '#8b949e',
                    },
                  }}
                >
                  {option.label || option.id}
                </Box>
              </li>
            )}}
          options={options}
          getOptionLabel={(option) => option.label || option.id}
          renderInput={(params) => (
            <InputBase
              ref={params.InputProps.ref}
              inputProps={params.inputProps}
              autoFocus
              className={classes.inputBase}
            />
          )}

          {...rest}
        />
      </Popper>
    </div>
  )
}



