import { useState } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

import CheckIcon from '@mui/icons-material/CheckCircleRounded'
import InactiveIcon from '@mui/icons-material/RemoveCircleOutlineOutlined'
import ErrorIcon from '@mui/icons-material/ErrorOutlineRounded'
import MapIcon from '@mui/icons-material/RoomOutlined'
import CaretIcon from '@mui/icons-material/ArrowDropDownRounded'
import CaretIconUp from '@mui/icons-material/ArrowDropUpRounded'


import Badge from '@mui/material/Badge'
import Tooltip from '@mui/material/Tooltip'
import Button from '@mui/material/Button'

import { NODE_STATUS_RANGE } from '/components/apis/beehive'
import NodeLastReported from '/components/utils/NodeLastReported'


import * as utils from '/components/utils/units'
import * as BK from '/components/apis/beekeeper'



export const gpsIcon = (obj) =>
  <>
    {obj.hasStaticGPS &&
      <LiveGPSDot invisible={!obj.hasLiveGPS} color="primary" variant="dot">
        <MapIcon fontSize="small"/>
      </LiveGPSDot>
    }
    {!obj.hasStaticGPS && obj.hasLiveGPS &&
      <MapIcon fontSize="small" style={{color: '#36b8ff'}}/>
    }
  </>


const LiveGPSDot = styled(Badge)`
  .MuiBadge-badge {
    right: 3px;
    top: 2px;
    padding: 0px;
  }
`


export function status(val, obj) {
  if (!obj.elapsedTimes) {
    return (
      <Tooltip
        title={`No sys.uptime(s) in ${NODE_STATUS_RANGE}`}
        componentsProps={{tooltip: {sx: {background: '#000'}}}}
        placement="top">
        <InactiveIcon className="inactive status-icon" />
      </Tooltip>
    )
  }

  let icon
  if (val == 'reporting')
    icon = <CheckIcon className="success status-icon" />
  else
    icon = <ErrorIcon className="failed status-icon" />

  return (
    <Tooltip
      title={
        <>
          Last reported metric<br/>
          <NodeLastReported computes={obj.computes} elapsedTimes={obj.elapsedTimes} />
        </>
      }
      componentsProps={{tooltip: {sx: {background: '#000'}}}}
      placement="top"
    >
      {icon}
    </Tooltip>
  )
}


export function vsn(val, obj) {
  if (!obj.hasStaticGPS && !obj.hasLiveGPS)
    return

  return (
    <NodeCell className="flex items-center justify-between">
      <Link to={`/node/${val}`}>{val}</Link>
      {gpsIcon(obj)}
    </NodeCell>
  )
}

const NodeCell = styled.div`
  margin-right: .2em;
  .MuiButtonBase-root {
    margin-bottom: 2px;
  }
`


export function lastUpdated(elapsedTimes, obj) {
  if (!elapsedTimes) return '-'

  return <NodeLastReported computes={obj.computes} elapsedTimes={elapsedTimes} />
}


export function uptimes(val) {
  if (!val) return '-'

  return Object.keys(val).map(host =>
    <div key={host}>{utils.prettyTime(val[host])}</div>
  )
}


export function sensors(sensors: BK.SimpleManifest['sensors'][]) {
  return <Sensors data={sensors} />
}

function Sensors(props) {
  const {data} = props

  const [expanded, setExpanded] = useState(false)

  const count = data?.length

  return (
    <SensorList>
      {data.map((sensor, i) => {
        const {hw_model, name} = sensor
        return (
          <li key={i}>
            <Link to={`https://portal.sagecontinuum.org/sensors/${hw_model}`} target="_blank">
              {hw_model}
            </Link>
            {' '}{name != hw_model.toLowerCase() && name}
          </li>
        )
      })
      }
    </SensorList>
  )
}


const SensorList = styled.ul`
  padding: 0;
  font-size: 9pt;
  list-style: none;
  li {
    white-space: nowrap;
  }
`

