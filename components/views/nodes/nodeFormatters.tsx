import { useState } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

import CheckIcon from '@mui/icons-material/CheckCircleRounded'
import InactiveIcon from '@mui/icons-material/RemoveCircleOutlineOutlined'
import ErrorIcon from '@mui/icons-material/ErrorOutlineRounded'
import MapIcon from '@mui/icons-material/RoomOutlined'

import Badge from '@mui/material/Badge'
import Tooltip from '@mui/material/Tooltip'

import { NODE_STATUS_RANGE } from '/components/apis/beehive'
import NodeLastReported from '/components/utils/NodeLastReported'


import * as utils from '/components/utils/units'
import * as BK from '/components/apis/beekeeper'

import config from '/config'
const {sensorMapping} = config

export function gpsIcon(obj) {
  return (
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
  )
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


export function vsn(val, obj) {
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


type SensorsProps = {
  data: BK.SimpleManifest['sensors'][]
}

export function Sensors(props: SensorsProps) {
  const {data} = props

  const [expanded, setExpanded] = useState(false)

  if (!data) return <></>

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



const TT = (props) =>
  <Tooltip placement="right" {...props}><span>{props.children}</span></Tooltip>



export function topSensors(v, obj) {
  const {sensors} = obj
  const sens = sensors.filter(({name}) => name.match(/top|raingauge/gi))

  return <SensorList>
    {sens.map(({name, hw_model, hardware}, i) =>
      <li key={i}>
        <TT title={`${name} | ${hardware}`}>
          <Link to={`/sensors/${sensorMapping[hw_model] || hw_model}`}>{hw_model}</Link>
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
          <Link to={`/sensors/${sensorMapping[hw_model] || hw_model}`}>{hw_model}</Link>
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
          <Link to={`/sensors/${sensorMapping[hw_model] || hw_model}`}>{hw_model}</Link>
        </TT>
      </li>
    )}
  </SensorList>
}



export function rightSensors(v, obj) {
  const {sensors} = obj
  const sens = sensors.filter(({name, scope}) =>
    (name.match(/right/gi) || scope.match(/rpi/gi)) && !name.match(/raingauge/gi)
  )

  return <SensorList>
    {sens.map(({name, hw_model, hardware}, i) =>
      <li key={i}>
        <TT title={`${name} | ${hardware}`}>
          <Link to={`/sensors/${sensorMapping[hw_model] || hw_model}`}>{hw_model}</Link>
        </TT>
      </li>
    )}
  </SensorList>
}



export function additionalSensors(v, obj) {
  const {sensors} = obj
  const sens = sensors.filter(({name, scope}) =>
    !name.match(/top|bottom|left|right/gi) && scope.match(/global/gi)
  )


  return <SensorList>
    {sens.map(({name, hw_model, hardware}, i) =>
      <li key={i}>
        <TT title={`${name} | ${hardware}`}>
          <Link to={`/sensors/${sensorMapping[hw_model] || hw_model}`}>{hw_model}</Link>
        </TT>
      </li>
    )}
  </SensorList>
}

