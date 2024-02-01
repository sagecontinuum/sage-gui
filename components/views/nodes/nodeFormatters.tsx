import styled from 'styled-components'
import { Link } from 'react-router-dom'

import CheckIcon from '@mui/icons-material/CheckCircleRounded'
import InactiveIcon from '@mui/icons-material/ReportProblemOutlined'
import PendingIcon from '@mui/icons-material/PendingOutlined'
import ErrorIcon from '@mui/icons-material/ErrorOutlineRounded'
import MapIcon from '@mui/icons-material/RoomOutlined'

import Badge from '@mui/material/Badge'
import Tooltip from '@mui/material/Tooltip'

import { NODE_STATUS_RANGE } from '/components/apis/beehive'
import NodeLastReported from '/components/utils/NodeLastReported'
import Dot from '/components/utils/Dot'

import * as utils from '/components/utils/units'
import * as BK from '/components/apis/beekeeper'


export function gpsIcon(obj) {
  const {hasLiveGPS, hasStaticGPS} = obj

  if (hasStaticGPS) {
    return (
      <Tooltip
        placement="top"
        title={hasLiveGPS ?
          <>Static GPS<br/><Dot size="8" /> {'->'} recent live GPS found</> :
          'Static GPS'
        }
      >
        <LiveGPSDot invisible={!hasLiveGPS} color="primary" variant="dot">
          <MapIcon fontSize="small"/>
        </LiveGPSDot>
      </Tooltip>
    )
  } else if (!hasStaticGPS && hasLiveGPS) {
    return (
      <Tooltip title={<>Live GPS<br/>(no static gps found)</>}>
        <MapIcon fontSize="small" style={{color: '#36b8ff'}}/>
      </Tooltip>
    )
  }
}


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


const phaseNotes = {
  Maintenance: 'In Maintenance'
}

export function statusWithPhase(val, obj) {
  const phase = obj.node_phase_v3
  const phaseTitle = phaseNotes[phase] || phase

  let icon
  if (phase == 'Deployed' && val == 'reporting')
    icon = <CheckIcon className="success status-icon" />
  else if (phase == 'Deployed' && val != 'reporting')
    icon = <ErrorIcon className="failed status-icon" />
  else if (phase == 'Maintenance')
    icon = <InactiveIcon className="in-progress status-icon" />
  else if (phase == 'Awaiting Deployment')
    icon = <PendingIcon className="inactive status-icon" />
  else
    icon = <PendingIcon className="inactive status-icon" />

  return (
    <Tooltip
      title={
        <>
          <b>{phaseTitle}</b><br/>
          {phase == 'Deployed' &&
            <div>
              <br/>
              Last reported metrics:<br/>
              {obj.elapsedTimes ?
                <NodeLastReported computes={obj.computes} elapsedTimes={obj.elapsedTimes} /> :
                `No sys.uptime(s) in ${NODE_STATUS_RANGE}`
              }
            </div>
          }
        </>
      }
      componentsProps={{tooltip: {sx: {background: '#000'}}}}
      placement="top"
    >
      {icon}
    </Tooltip>
  )
}


export function vsn(val) {
  return (
    <NodeCell className="flex items-center justify-between">
      <Link to={`/node/${val}`}>{val}</Link>
    </NodeCell>
  )
}

export function vsnWithGPS(val, obj) {
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


export function gps(_, obj, newline = false) {
  return <div className="flex items-center">
    <span className="gps-icon">{gpsIcon(obj)}</span>

    {(!obj.lat || !obj.lng) ? 
      '-' :
      `${obj.lat},` + (newline ? '\n' : '') + `${obj.lng}`
    }
  </div>
}



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


type SensorsProps = {
  data: BK.FlattenedManifest['sensors']
}

export function Sensors(props: SensorsProps) {
  const {data} = props

  if (!data) return <></>

  const len = data.length

  return (
    <SensorList>
      {data.map((sensor, i) => {
        const {hw_model, hardware, name} = sensor
        return (
          <span key={i}>
            <Tooltip placement="top" title={name == hardware ? name : `${hardware} | ${name}`}>
              <Link to={`/sensors/${hw_model}`}>
                {hw_model}
              </Link>
            </Tooltip>
            {i < len - 1  && ', '}
          </span>
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



const TT = (props) =>
  <Tooltip placement="right" {...props}><span>{props.children}</span></Tooltip>



export function topSensors(v, obj) {
  const {sensors} = obj
  const sens = sensors.filter(({name}) => name.match(/top|raingauge/gi))

  return <SensorList>
    {sens.map(({name, hw_model, hardware}, i) =>
      <li key={i}>
        <TT title={`${name} | ${hardware}`}>
          <Link to={`/sensors/${hw_model}`}>{hw_model}</Link>
        </TT>
      </li>
    )}
  </SensorList>
}



export function bottomSensors(v, obj) {
  const {sensors} = obj
  const sens = sensors.filter(({name}) => name.match(/bottom/gi))

  return <SensorList>
    {sens.map(({name, hw_model, hardware}, i) =>
      <li key={i}>
        <TT title={`${name} | ${hardware}`}>
          <Link to={`/sensors/${hw_model}`}>{hw_model}</Link>
        </TT>
      </li>
    )}
  </SensorList>
}



export function leftSensors(v, obj) {
  const {sensors} = obj
  const sens = sensors.filter(({name}) => name.match(/left/gi))

  return <SensorList>
    {sens.map(({name, hw_model, hardware}, i) =>
      <li key={i}>
        <TT title={`${name} | ${hardware}`}>
          <Link to={`/sensors/${hw_model}`}>{hw_model}</Link>
        </TT>
      </li>
    )}
  </SensorList>
}



export function rightSensors(v, obj) {
  const {sensors} = obj
  const sens = sensors.filter(({name, scope}) =>
    (name.match(/right/gi) || scope.match(/^rpi$/i)) && !name.match(/raingauge/gi)
  )

  return <SensorList>
    {sens.map(({name, hw_model, hardware}, i) =>
      <li key={i}>
        <TT title={`${name} | ${hardware}`}>
          <Link to={`/sensors/${hw_model}`}>{hw_model}</Link>
        </TT>
      </li>
    )}
  </SensorList>
}



export function additionalSensors(v, obj) {
  const {sensors} = obj
  const sens = sensors.filter(({name}) =>
    !name.match(/top|bottom|left|right|gps|bme280|microphone|raingauge|bme680/gi)
  )

  return <SensorList>
    {sens.map(({name, hw_model, hardware}, i) =>
      <li key={i}>
        <TT title={`${name} | ${hardware}`}>
          <Link to={`/sensors/${hw_model}`}>{hw_model}</Link>
        </TT>
      </li>
    )}
  </SensorList>
}

