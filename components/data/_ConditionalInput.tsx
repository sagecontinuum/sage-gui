/**
 * unused conditional input for QueryBuilder
 */

import { useState } from 'react'
import { TextField, MenuItem, Popper, Autocomplete } from '@mui/material'
import { type Condition, ops } from './types.d'


type ConditionalInputProps =
Condition & {
    names: string[]
    onChange(name: keyof Condition, value: Condition['value'])
  }

export default function ConditionalInput(props: ConditionalInputProps) {
  const {names, name, onChange} = props

  // support raw text name inputs too
  const [newInput, setNewInput] = useState(false)

  return (
    <div className="flex items-center gap">
      <div className="flex column">
        <h4 className="no-margin">Filter</h4>
        <small>
          (<a onClick={() => setNewInput(!newInput)}>
            {newInput ? 'filter menu' : 'free input'}
          </a>)
        </small>
      </div>

      {newInput ?
        <TextField
          placeholder="env.some.value"
          onChange={(evt) => onChange('name', evt.target.value)}
        /> :
        <Autocomplete
          options={(names || [])}
          renderInput={(props) =>
            <TextField {...props}  />}
          PopperComponent={(props) =>
            <Popper {...props} sx={{minWidth: '400px'}} />}
          value={name}
          onChange={(evt, val) => onChange('name', val)}
          sx={{width: '300px'}}
        />
      }

      <TextField select
        defaultValue={'>'}
        onChange={(evt) => onChange('op', evt.target.value)}
        sx={{width: '70px'}}
      >
        {Object.entries(ops).map(([v, l]) =>
          <MenuItem key={v} value={v}>{l}</MenuItem>
        )}
      </TextField>

      <TextField
        placeholder="3"
        onChange={(evt) => onChange('value', evt.target.value)}
      />
    </div>
  )
}
