/* eslint-disable react/display-name */
import styled from 'styled-components'
import {Link} from 'react-router-dom'

import CheckIcon from '@mui/icons-material/CheckCircleRounded'
import InactiveIcon from '@mui/icons-material/RemoveCircleOutlineOutlined'
import ErrorIcon from '@mui/icons-material/ErrorOutlineRounded'
import Badge from '@mui/material/Badge'
import MapIcon from '@mui/icons-material/RoomOutlined'
import Tooltip from '@mui/material/Tooltip'

import NodeLastReported from '/components/utils/NodeLastReported'
import * as utils from '/components/utils/units'
import settings from '/apps/project/settings'
import config from '/config'

import { NODE_STATUS_RANGE } from '/components/apis/beehive'

import * as formatters from '/components/views/nodes/nodeFormatters'

const SAGE_UI_PROJECT = settings.SAGE_UI_PROJECT

const {additional_sensors} = config


const parseID = (cam: string) =>
  cam.includes('(') ? cam.slice( cam.indexOf('(') + 1, cam.indexOf(')') ) : cam.replace(/ /g, '-')


const columns = [{
  id: 'status',
  label: 'Status',
  format: formatters.status,
  width: '1px'
}, {
  id: 'node_type',
  label: 'Type'
}, {
  id: 'vsn',
  label: 'VSN',
  width: '50px',
  format: formatters.vsn
}, {
  id: 'node_id',
  label: 'ID',
  width: '100px',
  hide: true
},
/* {
  id: 'node_phase',
  label: 'Phase',
  hide: true
} */
{
  id: 'focus',
  label: 'Focus'
}, {
  id: 'elapsedTimes',
  label: 'Last Updated',
  format: formatters.lastUpdated,
  hide: true
}, {
  id: 'uptimes',
  label: 'Uptime',
  format: formatters.uptimes,
  hide: true
}, {
  id: 'location',
  label: 'Location',
  hide: SAGE_UI_PROJECT == 'sage'
}, {
  id: 'gps',
  label: 'GPS',
  format: (val, obj) => {
    if (!obj || !obj.lat || !obj.lng) return '-'
    return `${obj.lat}, ${obj.lng}`
  }
}, {
  id: 'alt',
  label: 'Altitude',
  format: (val) => {
    return val || '-'
  },
  hide: true
}, {
  id: 'sensors',
  label: 'Sensors',
  format: formatters.sensors
}, {
  id: 't_sensors',
  label: 'Top Sensors',
  format: (v, obj) => {
    if (obj.node_type != 'WSN')
      return '-'

    const {top_camera: cam} = obj
    const id = parseID(cam)
    return <SensorList>
      {cam != 'none' &&
        <li>
          <TT title="Top camera">
            <Link to={`/sensors/${id}`}>{cam}</Link>
          </TT>
        </li>}
      <li><TT title="Rainfall sensor"><Link to="/sensors/rg-15">RG-15</Link></TT></li>
    </SensorList>
  },
  hide: true
}, {
  id: 'b_sensors',
  label: 'Bottom Sensors',
  format: (v, obj) => {
    if (obj.node_type != 'WSN')
      return '-'

    const {bottom_camera: cam} = obj
    const id = parseID(cam)
    return <SensorList>
      {cam != 'none' ?
        <li><TT title="Bottom camera">
          <Link to={`/sensors/${id}`}>{cam}</Link>
        </TT></li> : '-'}
    </SensorList>
  },
  hide: true
}, {
  id: 'l_sensors',
  label: 'Left Sensors',
  format: (v, obj) => {
    if (obj.node_type != 'WSN')
      return '-'

    const {left_camera: cam} = obj

    const id = parseID(cam)


    return <SensorList>
      {cam != 'none' ?
        <li><TT title="Left camera">
          {cam.includes('mobotix') ?
            cam : <Link to={`/sensors/${id}`}>{cam}</Link>}
        </TT></li>
        : '-'
      }
    </SensorList>
  }, hide:true
}, {
  id: 'r_sensors',
  label: 'Right Sensors',
  format: (v, obj) => {
    const {right_camera: cam, shield} = obj

    if (cam == 'none' && !shield)
      return '-'

    const id = parseID(cam)

    return <SensorList>
      {cam != 'none' ? <li>
        <TT title="Right camera">
          <Link to={`/sensors/${id}`}>{cam}</Link>
        </TT></li>
        : ''
      }
      {shield ?
        <li><TT title="Microphone">ML1-WS IP54</TT></li> : ''}
      {shield ?
        <li><TT title="temp, humidity, pressure, and gas sensor">
          <Link to={`/sensors/bme680`}>BME680</Link>
        </TT></li>
        : ''
      }
    </SensorList>
  },
  hide: true
}, {
  id: 'additional_sensors',
  label: 'Additional Sensors',
  format: (_, obj) => {
    const {vsn} = obj
    const sensors = additional_sensors[vsn]
    if (!sensors)
      return '-'

    return <SensorList>
      {sensors.map(name => <li key={name}>{name}</li>)}
    </SensorList>
  },
  hide: true
}, {
  id: 'commission_date',
  label: 'Commission Date',
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

const TT = (props) =>
  <Tooltip placement="right" {...props}><span>{props.children}</span></Tooltip>


export default columns
