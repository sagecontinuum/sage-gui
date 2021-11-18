/* eslint-disable react/display-name */
import React from 'react'
import styled from 'styled-components'
import {Link} from 'react-router-dom'

import InactiveIcon from '@mui/icons-material/RemoveCircleOutlineRounded'
import CheckIcon from '@mui/icons-material/CheckCircleRounded'
import Dot from '@mui/icons-material/FiberManualRecord'
import ChartsIcon from '@mui/icons-material/AssessmentOutlined'
import LaunchIcon from '@mui/icons-material/LaunchRounded'
import Badge from '@mui/material/Badge'
import IconButton from '@mui/material/IconButton'
import MapIcon from '@mui/icons-material/RoomOutlined'
import ThermoIcon from '@mui/icons-material/ThermostatRounded'
import Chip from '@material-ui/core/Chip'

import Tooltip from '@mui/material/Tooltip'

import * as utils from '../../../components/utils/units'
import * as BH from '../../apis/beehive'

import config from '../../../config'

import {colors} from '../../viz/TimelineChart'


const SENSOR_DASH = `${config.influxDashboard}/07b179572e436000?lower=now%28%29%20-%2024h`
const TEMP_DASH = `${config.influxDashboard}/082da52c87209000?lower=now%28%29%20-%2024h`


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
  if (!sanity) return <div className="text-center">-</div>

  const {warnings, failed} = sanity

  // build list of issues for tooltip
  const tt = []
  Object.keys(sanity).forEach(key => {
    if (!key.includes('sys.sanity_status'))
      return

    const name = key.split('sys.sanity_status.')[1]

    const {value, meta} = sanity[key][0]
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
    const issues = failed + (warnings || 0)
    return (
      <div className="text-center">
        <Tooltip title={<><h3 className="no-margin">{issues} recent issue{issues > 1 ? 's' : ''}:</h3><br/> {tt}</>} >
          <FailedBadge badgeContent={issues} />
        </Tooltip>
      </div>
    )
  } else if (warnings) {
    return (
      <div className="text-center">
        <Tooltip title={<><h3 className="no-margin">{warnings} warning{warnings > 1 ? 's' : ''}:</h3><br/> {tt}</>}>
          <WarningDot variant="dot" overlap="circular">
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

const FailedBadge = styled(Badge)`
  color: #fff;
  .MuiBadge-badge {
    background-color: hsl(0, 83%, 35%);
  }
`

const WarningDot = styled(Badge)`
  .MuiBadge-badge {
    background-color: #ffbd06;
  }
`


const getPluginStatusIcon = (data) => {
  if (!data || !data.details) return <div className="text-center">-</div>

  const {warnings, failed} = data

  // build list of issues for tooltip
  const tt = []
  data.details.forEach(obj => {
    const {value, meta} = obj
    const hasIssue = value > 0
    const severity = meta.severity
    const status = meta.status

    if (hasIssue)
      tt.push(
        <div className="flex items-center" key={status}>
          <Dot className={severity} fontSize="small" /> {obj.meta.deployment} ({status})
        </div>
      )
  })

  if (failed) {
    const issues = failed + (warnings || 0)
    return (
      <div className="text-center">
        <Tooltip title={<><h3 className="no-margin">{issues} recent issue{issues > 1 ? 's' : ''}:</h3><br/> {tt}</>} >
          <FailedBadge badgeContent={issues} />
        </Tooltip>
      </div>
    )
  } else if (warnings) {
    return (
      <div className="text-center">
        <Tooltip title={<><h3 className="no-margin">{warnings} warning{warnings > 1 ? 's' : ''}:</h3><br/> {tt}</>}>
          <WarningDot variant="dot" overlap="circular">
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


export function getColorClass(val, severe: number, warning: number, defaultClass?: string) {
  if (!val || val >= severe) return 'severe font-bold'
  else if (val > warning) return 'warning font-bold'
  else if (defaultClass) return defaultClass
  return ''
}


function fsAggregator(data) {
  return data?.reduce((acc, o) => {
    const mountPoint = o.meta.mountpoint
    const mntPath = o.meta.fstype + ':' + mountPoint

    const mntParts = mountPoint.split('/')
    const mntName = mntParts[mntParts.length - 1]
    const name = shortMntName(mntName)

    acc[name] = {
      mntPath,
      value: o.value
    }
    return acc
  }, {})
}

const shortMntName = name =>
  name.replace('root-', '')
    .replace('plugin-data', 'plugins')
    .replace('core_sdcard_test', 'sdcard')


function FSPercent({aggFSSize, aggFSAvail, host, mounts}) {
  if (!aggFSSize || !aggFSAvail) return <></>

  return (
    <>{
      mounts.map((key) => {
        const fsSize = aggFSSize[key].value
        const fsAvail = aggFSAvail[key].value

        const percent = ((fsSize - fsAvail) / fsSize * 100)

        // don't care about 'ro' for pi
        if (host == 'rpi' && key == 'ro') {
          return <React.Fragment key={key}></React.Fragment>
        }

        return (
          <React.Fragment key={key}>
            <Tooltip title={aggFSSize[key].mntPath} placement="top">
              <FSItem className={getColorClass(percent, 90, 80)}>
                {percent.toFixed(2)}%
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
  font-size: .85em;
  width: 40px;
`

const padding = {padding: '5px 0 0 10px'}
const cellWidth = 3
const cellHeight = 10
const cellPad = 1

function healthColor(val, obj) {
  if (val == null)
    return colors.noValue
  return val == 0 ? colors.red4 : colors.green
}

function sanityColor(val, obj) {
  if (val == null)
    return colors.noValue
  return val == 0 ? colors.green : colors.red4
}


function HealthSparkler(props) {
  const {data, colorFunc, name} = props

  if (!data) return <></>

  return (
    <Tooltip title={name} placement="right">
      <svg width="50" height="15" style={padding}>
        {data.map((o, j) =>
          <rect
            x={j * (cellWidth + cellPad)}
            width={cellWidth}
            height={cellHeight}
            fill={colorFunc(o.value, o)}
            key={j}
          />
        )}
      </svg>
    </Tooltip>
  )
}


const columns = [{
  id: 'health',
  label: 'Health',
  width: '5px',
  format: (obj, row) => {
    if (!obj) return

    const {health, sanity} = obj

    return <Link to={`/node/${row.id}`} style={{textDecoration: 'none'}}>
      {health.failed == 0 ?
        <Tooltip title={`All health tests passed`} placement="right">
          <GoodChip icon={<CheckIcon className="success" fontSize="small" />} label="pass" size="small" />
        </Tooltip> :
        <HealthSparkler data={health.details} colorFunc={healthColor} name="Node health" />
      }
      {sanity.failed == 0 ?
        <Tooltip title={`All sanity tests passed`} placement="right">
          <GoodChip icon={<CheckIcon className="success" fontSize="small"  />} label="pass" size="small" />
        </Tooltip> :
        <HealthSparkler data={sanity.details} colorFunc={sanityColor} name="Sanity tests" />
      }
    </Link>
  }
}, /* {
  id: 'pluginStatus',
  label: 'Plugins',
  width: '5px',
  format: (val) => getPluginStatusIcon(val)
}, */ {
  id: 'node_type',
  label: 'Type',
  hide: false
}, {
  id: 'id',
  label: 'ID',
  width: '100px',
  format: (val) => <Link to={`/node/${val}`}>{val}</Link>
}, {
  id: 'vsn',
  label: 'VSN',
  width: '50px',
  format: (val, obj) =>
    <NodeCell className="flex items-center justify-between">
      <Link to={`node/${obj.id}`}>
        {val ? val : `-`}
      </Link>
      {obj.lat && obj.lng
        && <MapIcon fontSize="small"/>
      }
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
  id: 'gps',
  label: 'GPS',
  format: (val, obj) => {
    if (!obj || !obj.lat || !obj.lng) return '-'
    return `${obj.lat}, ${obj.lng}, ${obj.alt}`
  },
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
          className="no-style"
          target="_blank"
          rel="noreferrer"
        >
          <ThermoIcon />
        </IconButton>
      </Tooltip>
    </>
}, {
  id: 'temp',
  label: 'Temp',
  format: (val) => {
    if (!val || val == -999) return '-'

    return <>
      <span className={getColorClass(val, 70, 65)}>
        {val.toFixed(1)}°C
      </span>
      {/* for °F
      <small className="muted">
        ({(val * 1.8 + 32).toFixed(1)} °F)
      </small>*/}
    </>
  }
}, {
  id: 'elaspedTimes',
  label: 'Last Updated',
  format: (val) => {
    if (!val) return '-'

    return Object.keys(val)
      .map(host =>
        <div key={host}>
          {host}: <b className={getColorClass(val[host], 90000, 63000, 'success font-bold')}>
            {utils.msToTime(val[host])}
          </b>
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
      <div key={host}>
        {val[host]?.reduce((acc, o) => acc + o.value, 0).toFixed(2)}
      </div>
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

    return (
      <>
        <div className="flex">
          <FSItem>plugins</FSItem>
          <FSItem>rw</FSItem>
          <FSItem>ro</FSItem>
        </div>
        {hosts.map((host, i) => {
          const aggFSSize = fsAggregator(obj.fsSize[host])
          const aggFSAvail = fsAggregator(obj.fsAvail[host])

          return (
            <div key={host + i} className="flex column">
              <div className="flex">
                <FSPercent
                  aggFSSize={aggFSSize}
                  aggFSAvail={aggFSAvail}
                  host={host}
                  mounts={['plugins', 'rw', 'ro']}
                />
              </div>
            </div>
          )
        })
        }
      </>
    )
  }
}, {
  id: 'rxBytes',
  label: 'Sent Bytes',
  format: (val) => {
    if (!val) return '-'

    return <div>todo</div>
  },
  hide: true
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

const GoodChip = styled(Chip)`
  &.MuiChip-root {
    background-color: #3ac37e;
    color: #fff;
    font-size: .9em;
    height: 18px;
    margin-bottom: 2px;
    cursor: pointer;
    svg {
      height: 15px;
    }
  }
`

export default columns
