import React, { useState } from 'react'
import styled from 'styled-components'

import FormControl from '@mui/material/FormControl'
import TextField from '@mui/material/TextField'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

import { AppConfig } from '../../apis/ecr'

import * as Auth from '../../../components/auth/auth'
const username = Auth.getUser()


type Props = {
  form: AppConfig
  onChange: (evt: React.ChangeEvent | React.ChangeEvent<{name?: string, value: unknown}>) => void
}

export default function ConfigForm(props: Props) {
  const {form, onChange} = props

  const [isValid, setIsValid] = useState<boolean>(true)

  const handleNameChange = (evt) => {
    const name = evt.target.value
    const isValid = /^[a-z0-9_-]*$/.test(name)
    setIsValid(isValid)
    onChange(evt)
  }

  return (
    <Form className="flex column" autoComplete="off">
      <div className="flex row">
        <FormControl variant="outlined" size="small">
          <InputLabel id="namespace-label">Namespace</InputLabel>
          <Select
            labelId="namespace-label"
            id="namespace"
            value={username}
            onChange={onChange}
            label="Namespace"
          >
            <MenuItem value={username}>{username}</MenuItem>
          </Select>
        </FormControl>
        <Slash>&nbsp;/&nbsp;</Slash>
        <TextField
          label="Name"
          name="name"
          value={form.name}
          onChange={handleNameChange}
          InputLabelProps={{ shrink: true }}
          placeholder="my-app"
          error={!isValid}
          helperText={!isValid && 'Only lowercase letters, numbers, "-", or "_" allowed'}
        />
        <TextField
          label="Version"
          name="version"
          value={form.version}
          onChange={onChange}
          style={{width: 100, marginLeft: 10}}
          InputLabelProps={{ shrink: true }}
          placeholder="1.0"
        />
      </div>
    </Form>
  )
}

const Form = styled.form`
  margin-top: 15px;

  .MuiTextField-root, .MuiFormControl-root {
    margin: 10px 0;
  }
`

const Slash = styled.div`
  height: 40px;
  font-size: 40px;
  color: #888;
`

