/* eslint-disable react/display-name */
import { Fragment } from 'react'
import styled from 'styled-components'
import {Link} from 'react-router-dom'

import CheckIcon from '@mui/icons-material/CheckCircleRounded'
import ChartsIcon from '@mui/icons-material/AssessmentOutlined'
import LaunchIcon from '@mui/icons-material/LaunchRounded'
import Badge from '@mui/material/Badge'
import IconButton from '@mui/material/IconButton'
import MapIcon from '@mui/icons-material/RoomOutlined'
import ThermoIcon from '@mui/icons-material/ThermostatRounded'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'

import * as utils from '/components/utils/units'

import config from '/config'
import settings from '../../settings'

import HealthSparkler, {healthColor, sanityColor} from '/components/viz/HealthSparkler'

const FAIL_THRES = settings.elapsedThresholds.fail
const WARNING_THRES = settings.elapsedThresholds.warning
const TEMP_DASH = `${config.influxDashboard}/08dca67bee0d9000?lower=now%28%29%20-%2024h`
//const SENSOR_DASH = `${config.influxDashboard}/07b179572e436000?lower=now%28%29%20-%2024h`


const dateOpts = {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric'
}

const sysTimeOpts = {
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric'
}


const LiveGPSDot = styled(Badge)`
  .MuiBadge-badge {
    right: 3px;
    top: 2px;
    padding: 0px;
  }
`

export function getColorClass(val, severe: number, warning: number, defaultClass?: string) {
  if (!val || val >= severe) return 'severe font-bold'
  else if (val > warning) return 'warning font-bold'
  else if (defaultClass) return defaultClass
  return ''
}


function fsAggregator(data) {
  return data?.reduce((acc, o) => {
    const mountPoint = o.meta.mountpoint
    console.log(mountPoint);
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
          return <Fragment key={key}></Fragment>
        }

        return (
          <Fragment key={key}>
            <Tooltip title={aggFSSize[key].mntPath} placement="top">
              <FSItem className={getColorClass(percent, 90, 80)}>
                {percent.toFixed(2)}%
              </FSItem>
            </Tooltip>
          </Fragment>
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



const columns = [{
  id: 'health',
  label: 'Health',
  width: '5px',
  format: (obj, row) => {
    if (!obj) return

    const {health, sanity} = obj

    return <Link to={`/node/${row.id}`} className="no-style flex column">
      {health.failed == 0 ?
        <Tooltip title={`All health tests passed`} placement="right">
          <GoodChip icon={<CheckIcon className="success" />} label="pass" />
        </Tooltip> :
        <HealthSparkler data={health.details} colorFunc={healthColor} name="Node health" />
      }
      {sanity.failed == 0 ?
        <Tooltip title={`All sanity tests passed`} placement="right">
          <GoodChip icon={<CheckIcon className="success" />} label="pass" />
        </Tooltip> :
        <HealthSparkler data={sanity.details} colorFunc={sanityColor} name="Sanity tests" />
      }
    </Link>
  }
}, {
  id: 'node_type',
  label: 'Type',
  hide: false
}, {
  id: 'id',
  label: 'ID',
  width: '100px',
  format: (val, obj) =>
    obj.node_type != 'Blade' ?
      <Link to={`/node/${val}`}>{val}</Link> : val
}, {
  id: 'vsn',
  label: 'VSN',
  width: '50px',
  format: (val, obj) =>
    <NodeCell className="flex items-center justify-between">
      {obj.node_type != 'Blade' ?
        <Link to={`/node/${obj.id}`}>{val || `-`}</Link> : (val || `-`)
      }
      {obj.lat && obj.lng &&
        <LiveGPSDot invisible={!obj.hasLiveGPS} color="primary" variant="dot">
          {obj.hasStaticGPS ?
            <MapIcon fontSize="small"/> :
            <MapIcon fontSize="small" style={{color: "#36b8ff"}}/>
          }
        </LiveGPSDot>
      }
    </NodeCell>
}, {
  id: 'project',
  label: 'Project'
}, {
  id: 'focus',
  label: 'Focus'
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
     {/*
      <Tooltip
        title={<>View sensors <LaunchIcon style={{fontSize: '1.1em'}}/></>}
        placement="top"
      >
        <IconButton
          size="small"
          href={`${SENSOR_DASH}&vars%5BVSN%5D=${obj.vsn}`}
          target="_blank"
          rel="noreferrer"
        >
          <ChartsIcon />
        </IconButton>
      </Tooltip>
      */}
      <Tooltip
        title={<>View thermals <LaunchIcon style={{fontSize: '1.1em'}}/></>}
        placement="top"
      >
        <IconButton
          size="small"
          href={`${TEMP_DASH}&vars%5BVSN%5D=${obj.vsn}`}
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
  id: 'elapsedTimes',
  label: 'Last Updated',
  format: (val) => {
    if (!val) return '-'

    return Object.keys(val)
      .map(host =>
        <div key={host}>
          {host}: <b className={getColorClass(val[host], FAIL_THRES, WARNING_THRES, 'success font-bold')}>
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
        {new Date(val[host] * 1000).toLocaleString('en-US', sysTimeOpts)}
      </div>
    )
  },
  hide: true
}, {
  id: 'registration_event',
  label: 'Registered',
  format: (val) => new Date(val).toLocaleString('en-US', dateOpts),
  hide: true
}, {
  id: 'top_camera',
  label: 'Top Camera',
  hide: true
}, {
  id: 'right_camera',
  label: 'Right Camera',
  hide: true
}, {
  id: 'left_camera',
  label: 'Left Camera',
  hide: true
}, {
  id: 'bottom_camera',
  label: 'Bottom Camera',
  hide: true
}, {
  id: 'commission_date',
  label: 'Commission Date',
  hide: true
}, {
  id: 'shield',
  label: 'Has Shield',
  format: (val) => val ? <CheckIcon className="success" /> : 'no',
  hide: true,
}, {
  id: 'modem',
  label: 'Modem',
  format: (val) => val ? <CheckIcon className="success" /> : 'no',
  hide: true
}, {
  id: 'modem_sim',
  label: 'Modem Sim',
  format: (val) => val ? <CheckIcon className="success" /> : 'no',
  hide: true
}]


const NodeCell = styled.div`
  margin-right: .2em;
  .MuiButtonBase-root {
    margin-bottom: 2px;
  }
`


export const GoodChip = styled(Chip)`
  &.MuiChip-root {
    background-color: #3ac37e;
    color: #fff;
    font-size: .9em;
    height: 18px;
    margin-top: 2px;
    cursor: pointer;
    svg {
      height: 15px;
    }
    span {
      padding: 0 7px;
    }
  }
`

export default columns
