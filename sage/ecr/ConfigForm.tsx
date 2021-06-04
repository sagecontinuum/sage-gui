import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

import FormControl from '@material-ui/core/FormControl'
import TextField from '@material-ui/core/TextField'
import InputLabel from '@material-ui/core/InputLabel'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import FormLabel from '@material-ui/core/FormLabel'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import CheckBox from '@material-ui/core/CheckBox'
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank'
import CheckBoxIcon from '@material-ui/icons/CheckBox'

import { AppConfig } from '../apis/ecr'

import * as Auth from '../../components/auth/auth'
const username = Auth.getUser()

const architectures = [
  'linux/amd64',
  'linux/arm64',
  'linux/arm/v6',
  'linux/arm/v7',
  'linux/arm/v8'
]


type Props = {
  form: AppConfig
  onChange: (form: AppConfig) => void
}

export default function ConfigForm(props: Props) {
  const {onChange} = props

  const [form, setForm] = useState(props.form)

  useEffect(() => {
    setForm(props.form)
  }, [props.form])


  const handleChange = (event, val?: string) => {
    const {name, value} = event.target

    let f
    if (name == 'architectures') {
      f = {...form}
      const archList = f.source.architectures
      f.source.architectures = event.target.checked ?
        [...archList, val] : archList.filter(v => v != val)
    } else {
      f = {...form, [name]: value}
    }

    onChange(f)
  }


  return (
    <Form className="flex column" autoComplete="off">
      <div className="flex row">
        <FormControl variant="outlined" size="small">
          <InputLabel id="namespace-label">Namespace</InputLabel>
          <Select
            labelId="namespace-label"
            id="namepsace"
            value={username}
            onChange={evt => handleChange(evt)}
            label="Namepsace"
          >
            <MenuItem value={username}>{username}</MenuItem>
          </Select>
        </FormControl>
        <Slash>&nbsp;/&nbsp;</Slash>
        <TextField
          label="Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
          placeholder="my-app"
        />
        <TextField
          label="Version"
          name="version"
          value={form.version}
          onChange={handleChange}
          style={{width: 100, marginLeft: 10}}
          InputLabelProps={{ shrink: true }}
          placeholder="1.0"
        />
      </div>

      <TextField
        label="Description"
        name="description"
        value={form.description}
        onChange={handleChange}
        fullWidth
        multiline
        rows={3}
        InputLabelProps={{ shrink: true }}
        placeholder="A description about my app"
      />

      <FormControl className="flex column">
        <FormLabel component="legend">Architecture</FormLabel>
        {architectures.map((arch) =>
          <FormControlLabel
            key={arch}
            control={
              <CheckBox
                name="architectures"
                checked={form.source?.architectures?.includes(arch)}
                onChange={(evt) => handleChange(evt, arch)}
                icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                checkedIcon={<CheckBoxIcon fontSize="small" />}
                color="primary"
                size="small"
              />
            }
            label={arch}
          />
        )}
      </FormControl>
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

