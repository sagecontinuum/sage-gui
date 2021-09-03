
import React from 'react'
import styled from 'styled-components'

import TextField from '@material-ui/core/TextField'
import FormControl from '@material-ui/core/FormControl'
import FormLabel from '@material-ui/core/FormLabel'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import CheckBox from '@material-ui/core/CheckBox'
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank'
import CheckBoxIcon from '@material-ui/icons/CheckBox'

import { AppConfig } from '../../../apis/ecr'



const architectures = [
  'linux/amd64',
  'linux/arm64',
  'linux/arm/v6',
  'linux/arm/v7',
  'linux/arm/v8'
]



type Props = {
  form: AppConfig
  onChange: (evt: React.ChangeEvent, val?: string) => void
}


export default function ConfigGenerator(props: Props) {
  const {form, onChange} = props


  return (
    <Root>
      <TextField
        label="Description"
        name="description"
        value={form.description}
        onChange={onChange}
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
                onChange={(evt) => onChange(evt, arch)}
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

`


const EditorContainer = styled.div`
  margin-top: 10px;
`

const Editor = styled.textarea`
  height: 400px;
  width: 100%;
  border: 1px solid #ccc;
  padding: 5px 10px;
`