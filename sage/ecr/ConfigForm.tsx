import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

import FormControl from '@material-ui/core/FormControl'
import TextField from '@material-ui/core/TextField'
import Select from '@material-ui/core/Select'
import FormLabel from '@material-ui/core/FormLabel'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import CheckBox from '@material-ui/core/CheckBox'
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank'
import CheckBoxIcon from '@material-ui/icons/CheckBox'


import { AppConfig } from '../apis/ecr'


const architectures = [
  'linux/amd64',
  'linux/arm/v7',
  'linux/arm64'
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
    <Root className="flex column">
      <div className="flex row">
        <TextField
          label="Namespace"
          name="namespace"
          value={form.namespace}
          onChange={handleChange}
          InputLabelProps={{ shrink: true}}
          size="small"
          margin="dense"
        />
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
        placeholder="My awesome app"
      />

      <FormControl>
        <FormLabel component="legend">Architecture</FormLabel>
        {architectures.map((arch) =>
          <FormControlLabel
            key={arch}
            control={
              <CheckBox
                name="architectures"
                checked={form.source.architectures.includes(arch)}
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
    </Root>
  )
}

const Root = styled.div`
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

