import { useState, useMemo, type MouseEvent } from 'react'
import { useTheme, alpha } from '@mui/material/styles'

import { styled } from '@mui/material/styles'

import Popper from '@mui/material/Popper'
import SettingsIcon from '@mui/icons-material/SettingsOutlined'
import ResetIcon from '@mui/icons-material/ManageHistoryRounded'
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

const StyledPopper = styled(Popper)(() => ({
  border: '1px solid rgba(27,31,35,.15)',
  boxShadow: '0 3px 12px rgba(27,31,35,.15)',
  borderRadius: 3,
  width: 300,
  zIndex: 9999,
  fontSize: 13,
  color: '#586069',
  backgroundColor: '#f6f8fa',
}))

const DivHeader = styled('div')(() => ({
  borderBottom: '1px solid #e1e4e8',
  padding: '8px 10px',
  fontWeight: 600,
}))

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  padding: 10,
  width: '100%',
  borderBottom: '1px solid #dfe2e5',

  '& input': {
    borderRadius: 4,
    backgroundColor: theme.palette.common.white,
    padding: 8,
    transition: theme.transitions.create(['border-color', 'box-shadow']),
    border: '1px solid #ced4da',
    fontSize: 12,
    '&:focus': {
      boxShadow: `${alpha(theme.palette.primary.main, 0.25)} 0 0 0 0.2rem`,
      borderColor: theme.palette.primary.main,
    },
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
  value: Option[]
  onChange: (opt: (string | Option)[]) => void
  onRestoreDefaults: () => void
  headerText?: string
  noOptionsText?: string
}

export default function ColumnMenu(props: Props) {
  const {
    options,
    value,
    headerText,
    onRestoreDefaults,
    onChange,
    ...rest
  } = props

  const [anchorEl, setAnchorEl] = useState(null)
  const theme = useTheme()

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget)
  }

  const open = Boolean(anchorEl)
  const id = open ? 'column-search' : undefined

  const defaultShownCount = useMemo(() =>
    options.filter(o => !o.hide).length
  , [options])

  return (
    <div>
      {defaultShownCount != value.length &&
        <Tooltip
          title="Restore default columns"
          placement="top"
        >
          <IconButton
            size="small"
            onClick={onRestoreDefaults}
          >
            <ResetIcon />
          </IconButton>
        </Tooltip>
      }
      <Tooltip
        title="Show/hide columns..."
        placement="top"
      >
        <IconButton
          size="small"
          onClick={handleClick}
          disableRipple
        >
          <SettingsIcon  />
        </IconButton>
      </Tooltip>

      <StyledPopper id={id} open={open} anchorEl={anchorEl} placement="bottom-start">
        <div>
          <DivHeader className="flex items-center justify-between">
            {headerText ? headerText : 'Select table columns'}
          </DivHeader>

          <Autocomplete
            open
            onClose={handleClick}
            multiple
            value={value}
            onChange={(event, newValue) => {
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
                        color: theme.palette.mode === 'light' ? '#586069' : '#8b949e',
                      },
                      fontSize: '.9em'
                    }}
                  >
                    {option.label || option.id}
                  </Box>
                </li>
              )
            }}
            options={options}
            getOptionLabel={(option) => option.label || option.id}
            renderInput={(params) => (
              <StyledInputBase
                ref={params.InputProps.ref}
                inputProps={params.inputProps}
                autoFocus
              />
            )}
            {...rest}
          />
        </div>
      </StyledPopper>
    </div>
  )
}



