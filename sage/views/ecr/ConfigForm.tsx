import React, { useState } from 'react'
import styled from 'styled-components'

import TextField from '@material-ui/core/TextField'
import Select from '@material-ui/core/Select'


import user from '../../../testToken'
import FormControl from '@material-ui/core/FormControl'



const initialState = {
  name: '',
  description: '',
  version: '',
  namespace: user.name,
  source: {
    architecture: ['']
  },
  url: '',
  directory: '',
  resources: [
    {type: '', view: '', min_resolution: ''}
  ],
  inputs: [
    {id: 'speed', type: 'int'}
  ],
  metadata: {}
}


type Props = {

}

export default function ConfigForm(props: Props) {
  const [form, setForm] = useState(initialState)

  return (
    <Root className="flex column">
      <div className="flex row">
        <TextField
          label="Namespace"
          value={form.namespace}
          onChange={(evt, val) => setForm(prev => ({...prev, version: val}))}
          InputLabelProps={{ shrink: true }}
        />
        <Slash>&nbsp;/&nbsp;</Slash>
        <TextField
          label="Name"
          value={form.name}
          onChange={(evt, val) => setForm(prev => ({...prev, name: val}))}
          InputLabelProps={{ shrink: true }}
        />
      </div>

      <TextField
        label="Version"
        value={form.version}
        onChange={(evt, val) => setForm(prev => ({...prev, version: val}))}
        style={{width: 100}}
        InputLabelProps={{ shrink: true }}
        placeholder="1.0"
      />

      <TextField
        label="Description"
        value={form.description}
        onChange={(evt, val) => setForm(prev => ({...prev, version: val}))}
        style={{width: 500}}
        multiline
        rows={2}
        InputLabelProps={{ shrink: true }}
        placeholder="My awesome app"
      />

      <FormControl variant="outlined">
        <Select
          value={form.source.architecture}
          onChange={(evt, val) => setForm(prev => ({...prev, architecture: val}))}
          label="Architectures"
          margin="dense"
        >
          <option value="linux/amd64" selected={true}>linux/amd64</option>
          <option value="linux/arm/v7">linux/arm/v7</option>
        </Select>
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

