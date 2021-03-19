

import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import Button from '@material-ui/core/Button'
import AddIcon from '@material-ui/icons/AddRounded'
import Alert from '@material-ui/lab/Alert'

import Table from '../../../components/table/Table'

import * as ECR from '../../api/ecr'


const columns = [
  {id: 'name', label: 'Name'},
  {id: 'namespace', label: 'Namespace'},
  {id: 'owner_id', label: 'Owner'},
]


type Row = {
  [key: string]: any
}


export default function AppList() {
  const [rows, setRows] = useState<Row[]>()
  const [error, setError] = useState(null)


  useEffect(() => {
    ECR.listApps()
      .then(data => setRows([data]))
      .catch(error => setError(error.message))
  }, [])


  return (
    <Root>
      <h3>My Apps</h3>

      <Button component={Link} to="/apps/create-app" variant="outlined" color="primary" startIcon={<AddIcon/>}>
        Add App
      </Button>

      {rows &&
        <Table
          columns={columns}
          rows={rows}
        />
      }

      {error &&
        <Alert severity="error">{error}</Alert>
      }
    </Root>
  )
}

const Root = styled.div`
  margin-top: 50px;
`

