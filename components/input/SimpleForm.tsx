import { FormEvent, useMemo } from 'react'
import styled from 'styled-components'

import { FormHelperText, FormControl, useFormControl, OutlinedInput } from '@mui/material'


type Field = {
  key: string
  label: string
  edit?: boolean
  type?: 'textarea' | string // todo(nc): add types
  maxLength?: number
}


type Props = {
  fields: Field[]
  data: {[key: string]: string}
  state: {[key: string]: string}
  isEditing: boolean
  onChange: (evt: FormEvent) => void
}

export default function SimpleForm(props: Props) {
  const {fields, data, state, isEditing, onChange} = props

  return (
    <Root>
      {fields.map(obj => {
        const {key, label, edit, type, maxLength} = obj
        const value = data[key]

        return (
          <div key={key}>
            <h2>{label}</h2>
            {isEditing && edit != false ?
              <FormControl>
                <OutlinedInput
                  placeholder={`My ${label}`}
                  aria-label={label}
                  name={key}
                  onChange={onChange}
                  value={state[key]}
                  multiline={type == 'textarea'}
                  minRows={type == 'textarea' ? 4 : 0}
                  style={type == 'textarea' ? {width: 500} : {width: 300}}
                  inputProps={{maxLength}}
                />
                <FocusedHelperText
                  text={state[key]?.length > 20 &&
                    `${maxLength - state[key]?.length} characters left`}
                />
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
