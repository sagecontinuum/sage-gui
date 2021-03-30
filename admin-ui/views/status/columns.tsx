/* eslint-disable react/display-name */
import React from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'


type NodeStatus = 'active' | 'warning' | 'failed' | 'inactive'

const getStateIcon = (status: NodeStatus) => {
  if (!status)
    return <Icon className="material-icons failed">error</Icon>
  else if (status == 'active')
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
  if (!val) return 'failed'
  if (val > 11) return 'failed'
  if (val >= 8) return 'warning'
  return 'success'
}


const prettyUptime = (secs: number) => {
  return new Date(secs * 1000).toISOString().substr(11, 8)
}

const columns = [
  {
    id: 'status',
    label: 'Status',
    width: '25px',
    format: (val) => getStateIcon(val)
  }, {
    id: 'id',
    label: 'Node ID',
    width: '200px'
  },

  /* {
    id: 'name',
    label: 'Name',
    format: val => <Link to={`/node/${val}`}>{val}</Link>
  }, */ {
    id: 'uptimes',
    label: 'Uptime',
    format: (val) => {
      if (!val)
        return '-'
      else if (val.unknown)
        return prettyUptime(val.unknown)

      return(
        <div>
          rpi: {prettyUptime(val.rpi)}<br/>
          nx: {prettyUptime(val.nx)}
        </div>
      )
    }
  }, {
    id: 'cpu',
    label: '% CPU',
    format: (val) => {
      if (!val) return '-'

      return(
        <div>
          rpi: {val.rpi.reduce((acc, o) => acc + o.value, 0).toFixed(2)}<br/>
          nx: {val.nx.reduce((acc, o) => acc + o.value, 0).toFixed(2)}<br/>
        </div>
      )
    }
  },
  {
    id: 'memTotal',
    label: 'mem',
    format: (val, obj) => {
      if (!val) return '-'
      return(
        <div>
          rpi: {obj.memFree.rpi[0].value} / {obj.memTotal.rpi[0].value}<br/>
          nx: {obj.memFree.nx[0].value} / {obj.memTotal.nx[0].value}<br/>
        </div>
      )
    }
  }, {
    id: 'sysTimes',
    label: 'Sys Times',
    format: (val) => {
      if (!val)
        return '-'
      else if (val.unknown)
        return new Date(val.unknown * 1000).toISOString()

      return(
        <div>
          rpi: {new Date(val.rpi * 1000).toISOString()}<br/>
          nx: {new Date(val.nx * 1000).toISOString()}
        </div>
      )
    }
  },
  {
    id: 'registration_event',
    label: 'Registered'
  },

  /*{
    id: 'lastUpdated',
    label: 'Last Updated',
    format: (val) =>
      <b className={getUpdatedColor(val)}>
        {val == 'N/A' ? val : `${val}s`}
      </b>
  }, {
    id: 'cpu',
    label: '% CPU',
    format: (val) => <b>{val}</b>
  }, {
    id: 'mem',
    label: 'Mem',
    format: (val) => <b>{val}gb</b>
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
  {id: 'lng', label: 'Lng', hide: true},
  {id: 'location', label: 'Location', hide: true},
  {id: 'contact', label: 'Contact', hide: true},
  {id: 'notes', label: 'Notes', hide: true}
  */
]


const oldColumns = [
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
    id: 'cpu',
    label: '% CPU',
    format: (val) => <b>{val}</b>
  }, {
    id: 'mem',
    label: 'Mem',
    format: (val) => <b>{val}gb</b>
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
  {id: 'lng', label: 'Lng', hide: true},
  {id: 'location', label: 'Location', hide: true},
  {id: 'contact', label: 'Contact', hide: true},
  {id: 'notes', label: 'Notes', hide: true}
]

export default columns
