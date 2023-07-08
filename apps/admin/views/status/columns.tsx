/* eslint-disable react/display-name */
import { Fragment, useState } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

import CheckIcon from '@mui/icons-material/CheckCircleRounded'
import LaunchIcon from '@mui/icons-material/LaunchRounded'
import CaretIcon from '@mui/icons-material/ArrowDropDownRounded'
import CaretIconUp from '@mui/icons-material/ArrowDropUpRounded'
import ThermoIcon from '@mui/icons-material/ThermostatRounded'

import Badge from '@mui/material/Badge'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import Button from '@mui/material/Button'

import * as utils from '/components/utils/units'
import * as BK from '/components/apis/beekeeper'

import config from '/config'

import HealthSparkler, { healthColor, sanityColor } from '/components/viz/HealthSparkler'
import  { getColorClass } from '/components/utils/NodeLastReported'

import * as formatters from '/components/views/nodes/nodeFormatters'


const TEMP_DASH = `${config.influxDashboard}/08dca67bee0d9000?lower=now%28%29%20-%2024h`
// const SENSOR_DASH = `${config.influxDashboard}/07b179572e436000?lower=now%28%29%20-%2024h`



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



function ComputeSummary(props) {
  const {data} = props

  const [expanded, setExpanded] = useState(false)

  const count = data.length

  if (expanded) {
    return <>
      <Button onClick={() => setExpanded(false)} >less <CaretIconUp /></Button>
      {data.map((sensor, i) => {
          const {name} = sensor
          return <div key={i}>
            {name}
          </div>
        })
      }
    </>
  } else if (count)  {
    return <a onClick={() => setExpanded(true)} className="flex items-center">
      {count} <CaretIcon />
    </a>
  } else {
    return <span>-</span>
  }
}



const columns = [{
  id: 'status',
  label: 'Status',
  format: formatters.status,
  width: '1px'
}, {
  id: 'health',
  label: 'Health',
  width: '5px',
  format: (obj, row) => {
    if (!obj) return

    const {health, sanity} = obj

    if (row.node_type == 'Blade') {
      return <Tooltip title={`Health/sanity tests need to be configured for blades`} placement="right">
        <span className="font-bold muted flex justify-center">n/a</span>
      </Tooltip>
    }

    return <Link to={`/node/${row.vsn}`} className="no-style flex column">
      {health?.details?.length == 0 ?
        <Tooltip title={`No health tests available`} placement="right">
          <span className="font-bold muted flex justify-center">n/a</span>
        </Tooltip> :
        <div className="flex justify-end">
          <HealthSparkler data={health.details} colorFunc={healthColor} name="Node health" />
        </div>
      }
      {sanity?.details?.length == 0 ?
        <Tooltip title={`No sanity tests available`} placement="right">
          <span className="font-bold muted flex justify-center">n/a</span>
        </Tooltip> :
        <div className="flex justify-end">
          <HealthSparkler data={sanity.details} colorFunc={sanityColor} name="Sanity tests" />
        </div>
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
  hide: true
}, {
  id: 'vsn',
  label: 'VSN',
  width: '50px',
  format: formatters.vsn
}, {
  id: 'project',
  label: 'Project'
}, {
  id: 'focus',
  label: 'Focus'
}, {
  id: 'node_phase_v3',
  label: 'Phase',
  hide: true
}, {
  id: 'location',
  label: 'Location',
  hide: true
}, {
  id: 'gps',
  label: 'GPS',
  format: (val, obj) => {
    if (!obj || !obj.lat || !obj.lng) return '-'
    return `${obj.lat}, ${obj.lng}`
  },
  hide: true
}, {
  id: 'alt',
  label: 'Altitude',
  format: (val) => {
    return val || '-'
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
  format: formatters.lastUpdated
}, {
  id: 'uptimes',
  label: 'Uptime',
  format: formatters.uptimes,
  hide: true
}, {
  id: 't_sensors',
  label: 'Top Sensors',
  format: formatters.topSensors,
  hide: true
}, {
  id: 'b_sensors',
  label: 'Bottom Sensors',
  format: formatters.bottomSensors,
  hide: true
}, {
  id: 'l_sensors',
  label: 'Left Sensors',
  format: formatters.leftSensors,
  hide: true
}, {
  id: 'r_sensors',
  label: 'Right Sensors',
  format: formatters.rightSensors,
  hide: true
}, {
  id: 'additional_sensors',
  label: 'Additional Sensors',
  format: formatters.additionalSensors,
  hide: true
}, {
  id: 'computes',
  label: 'Computes',
  format: (computes: BK.SimpleManifest['computes'][]) => {
    return <ComputeSummary data={computes} />
  },
  hide: true
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
},
/* (to be removed)
{
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
}, */
{
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


const SensorList = styled.ul`
  padding: 0;
  font-size: 9pt;
  list-style: none;
  li {
    white-space: nowrap;
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

export const NotAvailChip = styled(Chip)`
  &.MuiChip-root {
    background-color: #888;
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
