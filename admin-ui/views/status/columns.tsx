/* eslint-disable react/display-name */
import Divider from '@material-ui/core/Divider'
import React from 'react'
import styled from 'styled-components'

import * as utils from '../../../components/utils/units'

import { NodeStatus } from '../../node.d'

import config from '../../../config'
const HOST_SUFFIX_MAPPING = config.ui.hostSuffixMapping
const HOST_NAMES = Object.values(HOST_SUFFIX_MAPPING)




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
  return data?.reduce((acc, o) => {
    const key = o.meta.fstype + ':' + o.meta.mountpoint
    acc[key] = o.value
    return acc
  }, {})
}


function FSPercent({aggFSSize, aggFSAvail}) {
  if (!aggFSSize || !aggFSAvail) return <></>
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
      if (!val) return '-'

      return HOST_NAMES.map(host =>
        <div key={host}>
          {host}: <b className={getUpdatedColor(val[host])}>{utils.msToTime(val[host])}</b>
        </div>
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
      if (!val) return '-'

      return HOST_NAMES.map(host =>
        <div key={host}>rpi: {utils.prettyUptime(val[host])}</div>
      )
    }
  }, {
    id: 'cpu',
    label: 'CPU Secs',
    format: (val, obj) => {
      if (!val) return '-'

      return HOST_NAMES.map(host =>
        <div key={host}>{val[host]?.reduce((acc, o) => acc + o.value, 0).toFixed(2)}</div>
      )
    }
  },
  {
    id: 'memTotal',
    label: 'Mem',
    format: (val, obj) => {
      if (!val) return '-'

      return HOST_NAMES.map(host => {
        const total = (obj.memTotal[host] || [])[0]?.value
        const free = (obj.memFree[host] || [])[0]?.value

        return <div key={host}>{utils.bytesToSizeIEC(total - free)} / {utils.bytesToSizeIEC(total)}</div>
      })
    }
  }, {
    id: 'fsSize',
    label: 'FS Utilization',
    format: (val, obj) => {
      if (!val) return '-'

      const rpiAggFSSize = fsAggregator(obj.fsSize?.rpi)
      const rpiAggFSAvail = fsAggregator(obj.fsAvail?.rpi)
      const nxAggFSSize = fsAggregator(obj.fsSize?.nx)
      const nxAggFSAvail = fsAggregator(obj.fsAvail?.nx)

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
      if (!val) return '-'

      return HOST_NAMES.map(host =>
        <div key={host}>
          {val[host] && new Date(val[host] * 1000).toISOString()}
        </div>
      )
    }
  },
  {
    id: 'registration_event',
    label: 'Registered'
  }
]

export default columns
