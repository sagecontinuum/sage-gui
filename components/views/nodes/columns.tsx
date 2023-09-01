/* eslint-disable react/display-name */
import CheckIcon from '@mui/icons-material/CheckCircleRounded'

import settings from '/components/settings'
import * as formatters from '/components/views/nodes/nodeFormatters'

const PROJECT = settings.project.toLowerCase()


const columns = [{
  id: 'status',
  label: 'Status',
  format: formatters.status,
  width: '1px'
}, {
  id: 'node_type',
  label: 'Type',
  hide: PROJECT != 'sage'
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
},{
  id: 'focus',
  label: 'Focus'
}, {
  id: 'elapsedTimes',
  label: 'Last Reported',
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
  hide: PROJECT == 'sage'
}, {
  id: 'gps',
  label: 'GPS',
  format: (_, obj) => {
    return (!obj.lat || !obj.lng) ? '-' :`${obj.lat}, ${obj.lng}`
  }
}, {
  id: 'staticGPS',
  label: 'Static GPS',
  format: (_, obj) => {
    return (!obj.gps_lat || !obj.gps_lon) ? '-' :`${obj.gps_lat}, ${obj.gps_lon}`
  },
  hide: true
}, {
  id: 'liveGPS',
  label: 'Live GPS',
  format: (_, obj) => {
    return (!obj.liveLat || !obj.liveLon) ? '-' :`${obj.liveLat}, ${obj.liveLon}`
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


if (PROJECT != 'sage') {
  columns.splice(8, 0, {
    id: 'node_phase_v3',
    label: 'Phase'
  })
}

export default columns


