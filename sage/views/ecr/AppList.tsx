

import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import Button from '@material-ui/core/Button'
import AddIcon from '@material-ui/icons/AddRounded'

import Table from '../../../components/table/Table'

import config from '../../../config'
const url = config.ecr

import testToken from '../../../testToken'

const options = {
  headers: {
    Authorization: `sage ${testToken}`
  }
}

const columns = [
  {id: 'name', label: 'Name'},
  {id: 'namespace', label: 'Namespace'},
  {id: 'owner_id', label: 'Owner'},
]


type Row = {
  [key: string]: any
}


export default function PluginView() {

  const [rows, setRows] = useState<Row[]>()

  useEffect(() => {
    (async () => {
      const res = await fetch(`${url}/apps/sage/simple`, options)
      const data = await res.json()
      setRows([data])
    })()
  }, [])

  return (
    <Root>
      <Button component={Link} to="/apps/create-app" variant="outlined" color="primary" startIcon={<AddIcon/>}>
        New App
      </Button>
      <h3>My Apps</h3>

      {rows &&
        <Table
          columns={columns}
          rows={rows}
        />
      }
    </Root>
  )
}

const Root = styled.div`
  margin-top: 50px;
`

