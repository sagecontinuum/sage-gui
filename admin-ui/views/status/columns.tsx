/* eslint-disable react/display-name */
import React from 'react'
import styled from 'styled-components'
import {Link} from 'react-router-dom'

import ErrorIcon from '@material-ui/icons/ErrorRounded'
import InactiveIcon from '@material-ui/icons/RemoveCircleOutlineRounded'
import CheckIcon from '@material-ui/icons/CheckCircleRounded'
import Dot from '@material-ui/icons/FiberManualRecord'
import ChartsIcon from '@material-ui/icons/AssessmentOutlined'
import LaunchIcon from '@material-ui/icons/LaunchRounded'
import Badge from '@material-ui/core/Badge'
import IconButton from '@material-ui/core/IconButton'

import Tooltip from '@material-ui/core/Tooltip'

import * as utils from '../../../components/utils/units'

import * as BH from '../../apis/beehive'

import config from '../../../config'

const SENSOR_DASH = `${config.influxDashboard}/082da52c87209000?lower=now%28%29%20-%2024h`
const TEMP_DASH = `${config.influxDashboard}/07b179572e436000?lower=now%28%29%20-%2024h`


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


type MetricsByHost = {
  [host: string]: {
    [metricName: string]: BH.SanityMetric[] | number
  }
}

const getSanityIcon = (sanity: MetricsByHost) => {
  if (!sanity || !sanity.nx) return <div className="text-center">-</div>

  const {warnings, failed} = sanity.nx

  // build list of issues for tooltip
  const tt = []
  Object.keys(sanity.nx).forEach(key => {
    if (!key.includes('sys.sanity_status'))
      return

    const name = key.split('sys.sanity_status.')[1]

    const {value, meta} = sanity.nx[key][0]
    const hasIssue = value > 0
    const severity = meta.severity
    if (hasIssue)
      tt.push(
        <div className="flex items-center" key={name}>
          <Dot className={severity} fontSize="small" />{name}
        </div>
      )
  })

  if (failed) {
    const issues = failed + warnings
    return (
      <div className="text-center">
        <Tooltip title={<><h3 className="no-margin">{issues} recent issue{issues > 1 ? 's' : ''}:</h3><br/> {tt}</>} >
          <ErrorIcon className="failed" />
        </Tooltip>
      </div>
    )
  } else if (warnings) {
    return (
      <div className="text-center">
        <Tooltip title={<><h3 className="no-margin">{warnings} warning{warnings > 1 ? 's' : ''}:</h3><br/> {tt}</>}>
          <WarningDot variant="dot" overlap="circle">
            <CheckIcon className="success flex" />
          </WarningDot>
        </Tooltip>
      </div>
    )
  } else if (!failed) {
    return (
      <div className="text-center">

        <Tooltip title={`All tests passed`}>
          <CheckIcon className="success" />
        </Tooltip>
      </div>
    )
  } else {
    return (
      <div className="text-center">
        <InactiveIcon className="inactive" />
      </div>
    )
  }
}

const WarningDot = styled(Badge)`
  .MuiBadge-badge {
    background-color: #ffbd06;
  }
`


const getUpdatedClass = (val) => {
  if (!val || val > 90000) return 'failed'
  else if (val > 63000) return 'warning'
  return 'success'
}


const getFSClass = (val) => {
  if (!val || val > 90.0) return 'severe font-bold'
  else if (val > 80.0) return 'warning font-bold'
  return ''
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
    .replace('core_sdcard_test', 'sdcard')


function FSPercent({aggFSSize, aggFSAvail}) {
  if (!aggFSSize || !aggFSAvail) return <></>

  // avoid redundant mnts
  const percents = []

  return (
    <>{
      Object.keys(aggFSSize).sort().map((key) => {
        const percent = ((aggFSSize[key] - aggFSAvail[key]) / aggFSSize[key] * 100)

        if (percents.includes(percent))
          return <React.Fragment key={key}></React.Fragment>

        percents.push(percent)
        const mntParts = key.split('/')
        const mntPath = mntParts[mntParts.length - 1]

        return (
          <React.Fragment key={key}>
            <Tooltip title={key} placement="top">
              <FSItem className={getFSClass(percent)}>
                <div>{shortMntName(mntPath)}</div> {percent.toFixed(2)}%
              </FSItem>
            </Tooltip>
          </React.Fragment>
        )
      })
    }
    </>
  )
}

const FSItem = styled.div`
  margin-right: 1em;
  font-size: .9em;
  div {
    font-size: .9em;
  }
`



// todo(nc): remove rest of assumptions about hosts
const columns = [{
  id: 'sanity',
  label: 'Tests',
  width: '25px',
  format: (val) => getSanityIcon(val)
}, {
  id: 'kind',
  label: 'Type',
  hide: false
}, {
  id: 'id',
  label: 'ID',
  width: '100px',
  format: (val) => <Link to={`node/${val}`}>{val}</Link>
}, {
  id: 'vsn',
  label: 'VSN',
  width: '50px',
  format: (val, obj) =>
    <NodeCell className="flex items-center justify-between">
      <Link to={`node/${obj.id}`}>
        {val ? val : `-`} {/* or maybe this?: val ? val : `...${obj.id.slice(12)}` */}
      </Link>
    </NodeCell>
}, {
  id: 'project',
  label: 'Project',
  width: '140px'
}, {
  id: 'location',
  label: 'Location',
  hide: true
}, {
  id: 'data',
  label: 'Data',
  format: (val, obj) =>
    <>
      <Tooltip
        title={<>View sensors <LaunchIcon style={{fontSize: '1.1em'}}/></>}
        placement="top"
      >
        <IconButton
          size="small"
          href={`${SENSOR_DASH}&vars%5BnodeID%5D=${obj.id.toLowerCase()}`}
          target="_blank"
          rel="noreferrer"
        >
          <ChartsIcon />
        </IconButton>
      </Tooltip>
      <Tooltip
        title={<>View thermals <LaunchIcon style={{fontSize: '1.1em'}}/></>}
        placement="top"
      >
        <IconButton
          size="small"
          href={`${TEMP_DASH}&vars%5BnodeID%5D=${obj.id.toLowerCase()}`}
          target="_blank"
          rel="noreferrer"
        >
          <ChartsIcon />
        </IconButton>
      </Tooltip>
    </>
}, {
  id: 'temp',
  label: 'Temp',
  format: (val) => {
    if (!val || val == -999) return '-'

    return <>{val.toFixed(1)} <small className="muted">({(val * 1.8 + 32).toFixed(1)} °F)</small></>
  }
}, {
  id: 'elaspedTimes',
  label: 'Last Updated',
  format: (val) => {
    if (!val) return '-'

    return Object.keys(val)
      .map(host =>
        <div key={host}>
          {host}: <b className={getUpdatedClass(val[host])}>{utils.msToTime(val[host])}</b>
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
}, {
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
}, {
  id: 'registration_event',
  label: 'Registered',
  format: (val) => new Date(val).toLocaleString('en-US', dateOpts),
  hide: true
}]

const NodeCell = styled.div`
  margin-right: .2em;
  .MuiButtonBase-root {
    margin-bottom: 2px;
  }
`

export default columns
