
import React from 'react'
import styled from 'styled-components'

import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import FormControlLabel from '@mui/material/FormControlLabel'
import CheckBox from '@mui/material/CheckBox'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'

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