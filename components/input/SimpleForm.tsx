import { useMemo } from 'react'
import styled from 'styled-components'

import {
  FormHelperText, FormControl, useFormControl,
  Autocomplete, TextField
} from '@mui/material'


export type Field = {
  id: string
  label: string
  edit?: boolean
  type?: 'textarea' | string // todo(nc): add types
  helpText?: string
  placeholder?: string
  maxLength?: number
  multiple?: boolean
  width?: number | string
  options?: string[]
}


type Props<T> = {
  fields: Field[]
  data: T | {[id: string]: string | string[]}
  state: T | {[id: string]: string}
  isEditing: boolean
  onChange: (id: string, value: string | string[]) => void
}

export default function SimpleForm<T>(props: Props<T>) {
  const {fields, data, state, isEditing, onChange} = props

  const handleInputChange = (evt) => {
    const {name, value} = evt.target
    onChange(name, value)
  }

  const handleAutocompleteChange = (id: string, value: string[]) => {
    onChange(id, value)
  }

  return (
    <Root>
      {fields.map(obj => {
        const {
          id, label, edit, type, helpText, maxLength,
          multiple, options, width, placeholder,
        } = obj

        const value = data[id]

        return (
          <div key={id}>
            {(edit == false || !isEditing) &&
              <h2>{label}</h2>
            }
            {isEditing && edit != false ?
              <FormControl margin="normal">
                {multiple ?
                  <Autocomplete
                    multiple
                    freeSolo
                    options={options || []}
                    onChange={(_, value) => handleAutocompleteChange(id, value)}
                    // getOptionLabel={(option) => option.label}
                    defaultValue={value}
                    filterSelectedOptions
                    sx={{ width: width || 500 }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={label}
                        placeholder={placeholder}
                        slotProps={{
                          inputLabel: { shrink: true }
                        }}
                      />
                    )}
                  />
                  :
                  <TextField
                    label={label}
                    placeholder={placeholder}
                    aria-label={label}
                    name={id}
                    onChange={handleInputChange}
                    value={state[id]}
                    multiline={type == 'textarea'}
                    minRows={type == 'textarea' ? 4 : 0}
                    sx={{ width: width || (type == 'textarea' ?  500 : 300) }}
                    slotProps={{
                      htmlInput: {maxLength},
                      inputLabel: {shrink: true}
                    }} />
                }
                {helpText &&
                  <FormHelperText>{helpText}</FormHelperText>
                }
                {maxLength &&
                  <FocusedHelperText text={
                    state[id]?.length > 20 && `${maxLength - state[id]?.length} characters left`}
                  />
                }
              </FormControl> :
              <p>{value ? value : <i className="muted">Not available</i>}</p>
            }
          </div>
        )
      })}
    </Root>
  )
}

const Root = styled.div`
`


function FocusedHelperText({text}) {
  const { focused } = useFormControl()

  const helperText = useMemo(() => {
    return focused ? text : ''
  }, [focused, text])

  return <FormHelperText>{helperText}</FormHelperText>
}
