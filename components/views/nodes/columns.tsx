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
  label: 'Node',
  width: '50px',
  format: formatters.vsn
}, {
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
  id: 'city',
  label: 'City',
  hide: PROJECT == 'sage'
}, {
  id: 'state',
  label: 'State',
  hide: true
}, {
  id: 'gps',
  label: 'GPS',
  format: formatters.gps
}, {
  id: 'alt',
  label: 'Elevation (m)',
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


