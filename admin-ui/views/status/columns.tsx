/* eslint-disable react/display-name */
import React from 'react'
import styled from 'styled-components'
import {Link} from 'react-router-dom'

import IconButton from '@material-ui/core/IconButton'
import Divider from '@material-ui/core/Divider'
import InfoOutlined from '@material-ui/icons/InfoOutlined'
import Tooltip from '@material-ui/core/Tooltip'

import * as utils from '../../../components/utils/units'

import { NodeStatus } from '../../node.d'



const dateOpts = {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric'
}

const sysTimeOtps = {
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric'
}


const getStateIcon = (status: NodeStatus) => {
  if (!status)
    return <Icon className="material-icons failed">error</Icon>
  else if (status == 'loading')
    return <div className="text-center">-</div>
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

const shortMntName = name =>
  name.replace('root-', '')
    .replace('plugin-data', 'plugins')


function FSPercent({aggFSSize, aggFSAvail}) {
  if (!aggFSSize || !aggFSAvail) return <></>

  // avoid redundant mnts
  const percents = []

  return (
    <>{
      Object.keys(aggFSSize).sort().map((key, i) => {
        const percent = ((aggFSSize[key] - aggFSAvail[key]) / aggFSSize[key] * 100)

        if (percents.includes(percent))
          return <React.Fragment key={key}></React.Fragment>

        percents.push(percent)
        const mntParts = key.split('/')
        const mntPath = mntParts[mntParts.length - 1]

        return (
          <React.Fragment key={key}>
            <Tooltip title={key} placement="top">
              <FSItem><div>{shortMntName(mntPath)}</div> {percent.toFixed(2)}%</FSItem>
            </Tooltip>
          </React.Fragment>
        )
      })
    }
    </>
  )
}

const FSItem = styled.div`
  font-size: .9em;
  div {
    font-size: .9em;
  }
`



// todo(nc): remove rest of assumptions about hosts
const columns = [
  {
    id: 'status',
    label: 'Status',
    width: '25px',
    format: (val) => getStateIcon(val)
  }, {
    id: 'id',
    label: 'Node ID',
    width: '200px',
    format: (val) => <Link to={`node/${val}`}>{val}</Link>
  }, {
    id: 'elaspedTimes',
    label: 'Last Updated',
    format: (val) => {
      if (!val) return '-'

      return Object.keys(val)
        .map(host =>
          <div key={host}>
            {host}: <b className={getUpdatedColor(val[host])}>{utils.msToTime(val[host])}</b>
          </div>
        )
    }
  }, {
    id: 'uptimes',
    label: 'Uptime',
    format: (val) => {
      if (!val) return '-'

      return Object.keys(val).map(host =>
        <div key={host}>{utils.prettyTime(val[host])}</div>
      )
    }
  }, {
    id: 'cpu',
    label: 'CPU Secs',
    format: (val) => {
      if (!val) return '-'

      return Object.keys(val).map(host =>
        <div key={host}>{val[host]?.reduce((acc, o) => acc + o.value, 0).toFixed(2)}</div>
      )
    },
    hide: true
  },
  {
    id: 'memTotal',
    label: 'Mem',
    format: (val, obj) => {
      if (!val) return '-'

      return Object.keys(val).map(host => {
        const total = obj.memTotal[host]
        const free = obj.memFree[host]

        return (
          <div key={host}>
            {utils.bytesToSizeIEC(total - free)} / {utils.bytesToSizeIEC(total)}
          </div>
        )
      })
    }
  }, {
    id: 'fsSize',
    label: 'FS Utilization',
    format: (val, obj) => {
      if (!val) return '-'

      const hosts = Object.keys(val)

      return hosts
        .map((host, i) => {
          const aggFSSize = fsAggregator(obj.fsSize[host])
          const aggFSAvail = fsAggregator(obj.fsAvail[host])

          return (
            <div key={host + i} className="flex justify-between" style={{maxWidth: '200px'}}>
              <FSPercent aggFSSize={aggFSSize} aggFSAvail={aggFSAvail} />
              {/*i < hosts.length - 1 && <Divider flexItem style={{marginRight: 50}}/>*/}
            </div>
          )
        })
    }
  }, {
    id: 'sysTimes',
    label: 'Sys Time',
    format: (val) => {
      if (!val) return '-'

      return Object.keys(val).map(host =>
        <div key={host}>
          {new Date(val[host] * 1000).toLocaleString('en-US', sysTimeOtps)}
        </div>
      )
    },
    hide: true
  },
  {
    id: 'registration_event',
    label: 'Registered',
    format: (val) => new Date(val).toLocaleString('en-US', dateOpts),
    hide: true
  }
]

export default columns
