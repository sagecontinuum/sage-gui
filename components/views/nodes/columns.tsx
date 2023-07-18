/* eslint-disable react/display-name */
import CheckIcon from '@mui/icons-material/CheckCircleRounded'

import settings from '/components/settings'
import * as formatters from '/components/views/nodes/nodeFormatters'

const SAGE_UI_PROJECT = settings.SAGE_UI_PROJECT


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
  id: 't_sensors',
  label: 'Top Sensors',
  format: formatters.topSensors,
}, {
  id: 'b_sensors',
  label: 'Bottom Sensors',
  format: formatters.bottomSensors,
}, {
  id: 'l_sensors',
  label: 'Left Sensors',
  format: formatters.leftSensors,
}, {
  id: 'r_sensors',
  label: 'Right Sensors',
  format: formatters.rightSensors,
}, {
  id: 'additional_sensors',
  label: 'Additional Sensors',
  format: formatters.additionalSensors,
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


export default columns
