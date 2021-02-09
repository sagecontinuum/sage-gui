import React, { useState, useEffect } from 'react'
import styled from 'styled-components'

import Table from '../../components/table/Table'

import config from '../config'
const url = config.beekeeper


const columns = [
  {
    id: 'mode',
    label: 'State',
    format: (val) => getStateIcon(val)
  },
  {id: 'Node CNAME', label: 'Name'},
  {id: 'VSN'},
  {id: 'rSSH'},
  {id: 'NODE_ID', label: 'Node ID'},
  {id: 'iDRAC IP'},
  {id: 'iDRAC Port'},
  {id: 'eno1 address'},
  {id: 'eno2 address', hide: true},
  {id: 'Provisioning Date (version)', label: 'Provisioning Date'},
  {id: 'OS Version'},
  {id: 'Service Tag'},
  {id: 'Special Devices'},
  {id: 'BIOS Version', hide: true},
  {id: 'Lat', hide: true},
  {id: 'Lon', hide: true},
  {id: 'Location', hide: true},
  {id: 'Contact', hide: true},
  {id: 'Notes', hide: true}
]


type NodeState = 'active' | 'warning' | 'failed' | 'inactive'

const getStateIcon = (state: NodeState) => {
  if (state == 'active')
    return <span className="material-icons success">check_circle</span>
  else if (state == 'warning')
    return <span className="material-icons warning">warning_amber</span>
    else if (state == 'failed')
    return <span className="material-icons warning">error_outline</span>
  else
    return <span className="material-icons inactive">remove_circle_outline</span>
}



const mockState = (data: object[]) => {
  return data.map(obj => ({...obj, mode: obj['eno1 address'] == 'N/A' ? 'inactive' : 'active'}))
}


const filterData = (data: object[], query: string) => {
  return data.filter(row =>
    Object.values(row).join('').toLowerCase().includes(query.toLowerCase())
  )
}


function Overview() {
  const [data, setData] = useState(null)
  const [filtered, setFiltered] = useState(null)

  useEffect(() => {
    fetch(`${url}/blades.json`)
      .then(res => res.json())
      .then(data => {
        const rows = mockState(data)
        setData(rows)
        setFiltered(rows)
      })

  }, [])


  const onSearch = ({query}) => {
    setFiltered(filterData(data, query))
  }

  const onColumnChange = () => {

  }

  return (
    <Root>
      <TopContainer></TopContainer>

      <TableContainer>
        {filtered &&
          <Table
            rows={filtered}
            columns={columns}
            onSearch={onSearch}
            onColumnMenuChange={onColumnChange}
          />
        }
      </TableContainer>
    </Root>
  )
}

const Root = styled.div`
  padding: 10px;
`

const TopContainer = styled.div`
  height: 10px;
`

const TableContainer = styled.div`

`


export default Overview
