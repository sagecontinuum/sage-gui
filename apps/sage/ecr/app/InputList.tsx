import { useState } from 'react'

import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'

import Table from '/components/table/Table'
import * as ECR from '/components/apis/ecr'


const columns = [
  {id: 'id', label: 'Argument'},
  {id: 'type', label: 'Type'},
  {id: 'description', label: 'Description'},
  {id: 'default', label: 'Default'}
]


type Props = {
  versions: ECR.AppDetails[]
}

export default function InputList(props: Props) {
  const {versions} = props

  const initVer = versions[0]
  const [ver, setVer] = useState(initVer.version)
  const [inputs, setInputs] = useState(initVer.inputs)

  const handleChange = (evt) => {
    const {value} = evt.target
    setVer(value)
    setInputs(versions.find(o => o.version == value).inputs)
  }

  return (
    <div>
      <div className="flex items-center gap">
        <TextField select
          value={ver}
          label="Version"
          onChange={handleChange}
        >
          {versions.map(({version: v}) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
        </TextField>
      </div>

      {inputs &&
        <Table
          primaryKey="id"
          enableSorting
          columns={columns}
          rows={inputs}
          emptyNotice="No input arguments were provided"
        />
      }
    </div>
  )
}
