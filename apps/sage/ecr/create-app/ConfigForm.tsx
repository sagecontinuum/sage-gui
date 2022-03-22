import React, { useState } from 'react'
import styled from 'styled-components'

import FormControl from '@mui/material/FormControl'
import TextField from '@mui/material/TextField'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

import * as ECR from '../../apis/ecr'
import * as Auth from '/components/auth/auth'

import isDevUser from './ConfigForm'
const user = Auth.getUser()


type Props = {
  form: ECR.AppMeta
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
        <FormControl>
          <InputLabel id="namespace-label" required>Namespace</InputLabel>
          <Select
            labelId="namespace-label"
            name="namespace"
            value={form.namespace}
            onChange={(evt) => onChange(evt)}
            style={{width: 125}}
            label="Namespace *"
          >
            <MenuItem value={user}>{user}</MenuItem>
            {isDevUser && <MenuItem value="waggle">waggle</MenuItem>}
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
          required
        />
        <TextField
          label="Version"
          name="version"
          value={form.version}
          onChange={onChange}
          style={{width: 125, marginLeft: 10}}
          InputLabelProps={{ shrink: true }}
          placeholder="1.x (optional)"
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

