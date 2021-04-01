/* eslint-disable react/display-name */
import React from 'react'
import styled from 'styled-components'

import * as utils from '../../../components/utils/units'

import { NodeStatus } from '../../node.d'


const getStateIcon = (status: NodeStatus) => {
  if (!status)
    return <Icon className="material-icons failed">error</Icon>
  else if (status == 'loading')
    return '…'
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
  else if (val > 90000) return 'failed'
  else if (val > 63000) return 'warning'
  return 'success'
}



// todo(nc): remove assumptions about hosts
const columns = [
  {
    id: 'status',
    label: 'Status',
    width: '25px',
    format: (val) => getStateIcon(val)
  }, {
    id: 'elaspedTimes',
    label: 'Last Updated',
    format: (val) => {
      if (!val) return

      const {rpi, nx} = val
      return  (
        <>
          <b className={getUpdatedColor(rpi)}>{utils.msToTime(rpi)}</b><br/>
          <b className={getUpdatedColor(nx)}>{utils.msToTime(nx)}</b>
        </>
      )
    }
  }, {
    id: 'id',
    label: 'Node ID',
    width: '200px'
  }, {
    id: 'uptimes',
    label: 'Uptime',
    format: (val) => {
      if (!val)
        return '-'
      else if (val.unknown)
        return utils.prettyUptime(val.unknown)

      return (
        <>
          rpi: {utils.prettyUptime(val.rpi)}<br/>
          nx: {utils.prettyUptime(val.nx)}
        </>
      )
    }
  }, {
    id: 'cpu',
    label: 'CPU Secs',
    format: (val) => {
      if (!val) return '-'

      return (
        <>
          rpi: {val.rpi.reduce((acc, o) => acc + o.value, 0).toFixed(2)}<br/>
          nx: {val.nx.reduce((acc, o) => acc + o.value, 0).toFixed(2)}<br/>
        </>
      )
    }
  },
  {
    id: 'memTotal',
    label: 'Mem',
    format: (val, obj) => {
      if (!val) return '-'

      const rpiTotal = obj.memTotal.rpi[0].value,
        rpiFree = obj.memFree.rpi[0].value,
        nxTotal = obj.memTotal.nx[0].value,
        nxFree = obj.memFree.nx[0].value

      return(
        <>
          rpi: {utils.bytesToSizeIEC(rpiTotal - rpiFree)} / {utils.bytesToSizeIEC(rpiTotal)}<br/>
          nx: {utils.bytesToSizeIEC(nxTotal - nxFree)} / {utils.bytesToSizeIEC(nxTotal)}<br/>
        </>
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
        <>
          rpi: {new Date(val.rpi * 1000).toISOString()}<br/>
          nx: {new Date(val.nx * 1000).toISOString()}
        </>
      )
    }
  },
  {
    id: 'registration_event',
    label: 'Registered'
  }
]

export default columns
