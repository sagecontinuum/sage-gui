/* eslint-disable react/display-name */
import Divider from '@material-ui/core/Divider'
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


function fsAggregator(data) {
  return data.reduce((acc, o) => {
    const key = o.meta.fstype + ':' + o.meta.mountpoint
    acc[key] = o.value
    return acc
  }, {})
}


function FSPercent({aggFSSize, aggFSAvail}) {
  return (
    <div>{
      Object.keys(aggFSSize).map(key => {
        const precent = ((aggFSSize[key] - aggFSAvail[key]) / aggFSSize[key] * 100).toFixed(2)
        return (
          <div key={key}><small>{key.split(':')[0]}: {precent}%</small></div>
        )
      })
    }
    </div>
  )
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
          rpi: <b className={getUpdatedColor(rpi)}>{utils.msToTime(rpi)}</b><br/>
          nx: <b className={getUpdatedColor(nx)}>{utils.msToTime(nx)}</b>
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
    format: (val, obj) => {
      if (!val) return '-'

      return (
        <>
          {val.rpi.reduce((acc, o) => acc + o.value, 0).toFixed(2)}<br/>
          {val.nx.reduce((acc, o) => acc + o.value, 0).toFixed(2)}<br/>
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
          {utils.bytesToSizeIEC(rpiTotal - rpiFree)} / {utils.bytesToSizeIEC(rpiTotal)}<br/>
          {utils.bytesToSizeIEC(nxTotal - nxFree)} / {utils.bytesToSizeIEC(nxTotal)}<br/>
        </>
      )
    }
  }, {
    id: 'fsSize',
    label: 'FS Utilization',
    format: (val, obj) => {
      if (!obj.fsSize) return '-'

      const rpiAggFSSize = fsAggregator(obj.fsSize.rpi)
      const rpiAggFSAvail = fsAggregator(obj.fsAvail.rpi)

      const nxAggFSSize = fsAggregator(obj.fsSize.nx)
      const nxAggFSAvail = fsAggregator(obj.fsAvail.nx)

      return (
        <>
          <FSPercent aggFSSize={rpiAggFSSize} aggFSAvail={rpiAggFSAvail} />
          <Divider/>
          <FSPercent aggFSSize={nxAggFSSize} aggFSAvail={nxAggFSAvail} />
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
          {new Date(val.rpi * 1000).toISOString()}<br/>
          {new Date(val.nx * 1000).toISOString()}
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
