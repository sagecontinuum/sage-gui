import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

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
      <br/>
      <h3>My Plugins</h3>

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

`

