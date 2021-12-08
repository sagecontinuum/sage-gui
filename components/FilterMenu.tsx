import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { useTheme, styled } from '@mui/material/styles'
import Popper from '@mui/material/Popper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import DoneIcon from '@mui/icons-material/Done'
import Autocomplete, { autocompleteClasses } from '@mui/material/Autocomplete'
import ButtonBase from '@mui/material/ButtonBase'
import InputBase from '@mui/material/InputBase'
import Box from '@mui/material/Box'





const StyledAutocompletePopper = styled('div')(({ theme }) => ({
  [`& .${autocompleteClasses.paper}`]: {
    boxShadow: 'none',
    margin: 0,
    color: 'inherit',
    fontSize: 13,
  },
  [`& .${autocompleteClasses.listbox}`]: {
    backgroundColor: theme.palette.mode === 'light' ? '#fff' : '#1c2128',
    padding: 0,
    [`& .${autocompleteClasses.option}`]: {
      minHeight: 'auto',
      alignItems: 'flex-start',
      padding: 8,
      borderBottom: `1px solid  ${
        theme.palette.mode === 'light' ? ' #eaecef' : '#30363d'
      }`,
      '&[aria-selected="true"]': {
        backgroundColor: 'transparent',
      },
      '&[data-focus="true"], &[data-focus="true"][aria-selected="true"]': {
        backgroundColor: theme.palette.action.hover,
      },
    },
  },
  [`&.${autocompleteClasses.popperDisablePortal}`]: {
    position: 'relative',
  },
}))

function PopperComponent(props) {
  const { disablePortal, anchorEl, open, ...other } = props
  return <StyledAutocompletePopper {...other} />
}

PopperComponent.propTypes = {
  anchorEl: PropTypes.any,
  disablePortal: PropTypes.bool,
  open: PropTypes.bool.isRequired,
}

const StyledPopper = styled(Popper)(({ theme }) => ({
  border: `1px solid ${theme.palette.mode === 'light' ? '#e1e4e8' : '#30363d'}`,
  boxShadow: `0 8px 24px ${
    theme.palette.mode === 'light' ? 'rgba(149, 157, 165, 0.2)' : 'rgb(1, 4, 9)'
  }`,
  borderRadius: 6,
  width: 300,
  zIndex: theme.zIndex.modal,
  fontSize: 13,
  color: theme.palette.mode === 'light' ? '#24292e' : '#c9d1d9',
  backgroundColor: theme.palette.mode === 'light' ? '#fff' : '#1c2128',
}))

const StyledInput = styled(InputBase)(({ theme }) => ({
  padding: 10,
  width: '100%',
  borderBottom: `1px solid ${
    theme.palette.mode === 'light' ? '#eaecef' : '#30363d'
  }`,
  '& input': {
    borderRadius: 4,
    backgroundColor: theme.palette.mode === 'light' ? '#fff' : '#0d1117',
    padding: 8,
    transition: theme.transitions.create(['border-color', 'box-shadow']),
    border: `1px solid ${theme.palette.mode === 'light' ? '#eaecef' : '#30363d'}`,
    fontSize: 14,
    '&:focus': {
      boxShadow: `0px 0px 0px 3px ${
        theme.palette.mode === 'light'
          ? 'rgba(3, 102, 214, 0.3)'
          : 'rgb(12, 45, 107)'
      }`,
      borderColor: theme.palette.mode === 'light' ? '#0366d6' : '#388bfd',
    },
  },
}))

const Button = styled(ButtonBase)(({ theme }) => ({
  fontSize: 13,
  width: '100%',
  textAlign: 'left',
  paddingBottom: 8,
  color: theme.palette.mode === 'light' ? '#586069' : '#8b949e',
  fontWeight: 600,
  '&:hover,&:focus': {
    color: theme.palette.mode === 'light' ? '#0366d6' : '#58a6ff',
  },
  '& span': {
    width: '100%',
  },
  '& svg': {
    width: 16,
    height: 16,
  },
}))



type Option = {
  id: string
  label?: string
  hide?: boolean
  type?: string
}



type Props = {
  ButtonComponent: JSX.Element
  options: Option[]
  value: Option | Option[]
  multiple?: boolean    // default: true
  headerText?: string
  noOptionsText?: string
  noSelectedSort?: boolean
  onChange: (opt: (string | Option)[]) => void
}


export default function FilterMenu(props: Props) {
  const {
    ButtonComponent,
    options,
    multiple = true,
    onChange,
    headerText,
    noOptionsText,
    noSelectedSort = false,
    ...rest
  } = props

  const [anchorEl, setAnchorEl] = React.useState(null)
  const [value, setValue] = React.useState(props.value)
  const theme = useTheme()



  useEffect(() => {
    setValue(props.value)
  }, [props.value])


  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    if (anchorEl) {
      anchorEl.focus()
    }
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)
  const id = open ? 'autocomplete-filter' : undefined

  return (
    <React.Fragment>
      <Box>
        {ButtonComponent ?
          React.cloneElement(ButtonComponent, {onClick: handleClick}) : []
        }
      </Box>

      <StyledPopper id={id} open={open} anchorEl={anchorEl} placement="bottom-start">
        <ClickAwayListener onClickAway={handleClose}>
          <div>
            {headerText &&
              <div>{headerText}</div>
            }
            <Autocomplete
              open
              multiple={multiple}
              onClose={(event, reason) => {
                if (reason === 'escape') {
                  handleClose()
                }
              }}
              value={value}
              onChange={(event, newValue) => {
                onChange(newValue)
              }}
              disableCloseOnSelect
              PopperComponent={PopperComponent}
              renderTags={() => null}
              noOptionsText={noOptionsText || 'No items found'}
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
              options={
                multiple && noSelectedSort == false ?
                  [...options].sort((a, b) => {
                    // Display the selected labels first.
                    let ai = value.indexOf(a.id)
                    ai = ai === -1 ? value.length + options.indexOf(a) : ai
                    let bi = value.indexOf(b.id)
                    bi = bi === -1 ? value.length + options.indexOf(b) : bi
                    return ai - bi
                  })
                  :
                  [...options.filter(o => o.id == value?.id), ...options.filter(o => o.id != value?.id)]
              }
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(opt, val) => {
                return opt.id == val
              }}
              renderInput={(params) => (
                <StyledInput
                  ref={params.InputProps.ref}
                  inputProps={params.inputProps}
                  autoFocus
                  placeholder="Filter labels"
                />
              )}
              {...rest}
            />
          </div>
        </ClickAwayListener>
      </StyledPopper>
    </React.Fragment>
  )
}
