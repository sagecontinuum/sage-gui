import React from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'


type NodeStatus = 'active' | 'warning' | 'failed' | 'inactive'

const getStateIcon = (status: NodeStatus) => {
  if (status == 'active')
    return <Icon className="material-icons success">check_circle</Icon>
  else if (status == 'warning')
    return <Icon className="material-icons warning">warning_amber</Icon>
  else if (status == 'failed')
    return <Icon className="material-icons failed">error</Icon>
  else
    return <Icon className="material-icons inactive">remove_circle_outline</Icon>
}

const Icon = styled.span`
  margin-left: 10px;
`


const getUpdatedColor = (val) => {
  if (val == 'N/A') return 'failed'
  if (val > 11) return 'failed'
  if (val >= 8) return 'warning'
  return 'success'
}


const columns = [
  {
    id: 'status',
    label: 'Status',
    format: (val) => getStateIcon(val)
  }, {
    id: 'name',
    label: 'Name',
    format: val => <Link to={`/node/${val}`}>{val}</Link>
  }, {
    id: 'node_id',
    label: 'Node ID'
  }, {
    id: 'lastUpdated',
    label: 'Last Updated',
    format: (val) =>
      <b className={getUpdatedColor(val)}>
        {val == 'N/A' ? val : `${val}s`}
      </b>
  }, {
    id: 'mem',
    label: 'Mem',
    format: (val) => <b>{val}gb</b>
  }, {
    id: 'cpu',
    label: '% CPU',
    format: (val) => <b>{val}</b>
  }, {
    id: 'storage',
    label: 'Storage',
    format: (val) =>
      <b>
        {val == 'N/A' ? val : `${val}%`}
      </b>
  },
  {id: 'rSSH'},
  {id: 'iDRAC_IP', label: 'iDRAC IP'},
  {id: 'iDRAC_Port', label: 'iDRAC Port'},
  {id: 'eno1_address', label: 'eno1 address'},
  {id: 'eno2_address', label: 'eno2 address', hide: true},
  {id: 'provision_date', label: 'Provisioning Date'},
  {id: 'os_version', label: 'OS Version', hide: true},
  {id: 'service_tag', label: 'Service Tag'},
  {id: 'special_devices', label: 'Special Devices'},
  {id: 'VSN', hide: true},
  {id: 'bios_version', label: 'BIOS Version', hide: true},
  {id: 'lat', label: 'Lat', hide: true},
  {id: 'lon', label: 'Lon', hide: true},
  {id: 'location', label: 'Location', hide: true},
  {id: 'contact', label: 'Contact', hide: true},
  {id: 'notes', label: 'Notes', hide: true}
]

export default columns
