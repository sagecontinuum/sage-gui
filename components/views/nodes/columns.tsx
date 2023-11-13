/* eslint-disable react/display-name */
import CheckIcon from '@mui/icons-material/CheckCircleRounded'

import settings from '/components/settings'
import * as formatters from '/components/views/nodes/nodeFormatters'


const PROJECT = settings.project.toLowerCase()

const columns = [{
  id: 'status',
  label: 'Status',
  format: formatters.statusWithPhase,
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
  label: 'Last Reported Metrics',
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
  hide: true
}, {
  id: 'state',
  label: 'State'
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
  id: 'sensors',
  label: 'Sensors',
  format: (val) => <formatters.Sensors data={val} />
}, {
  id: 'commission_date',
  label: 'Commission Date',
}, {
  id: 'shield',
  label: 'Has Shield',
  format: (val) => val ? <CheckIcon className="success" /> : 'no',
  hide: true,
}, /* {
  id: 'modem',
  label: 'Modem',
  format: (val, obj) => {
    console.log('val', obj)
    val ? <CheckIcon className="success" /> : 'no'
  },
  hide: true
}, {
  id: 'modem_sim',
  label: 'Modem Sim',
  format: (val) => val ? <CheckIcon className="success" /> : 'no',
  hide: true
}*/]


if (PROJECT != 'sage') {
  columns.splice(4, 0, {
    id: 'node_phase_v3',
    label: 'Phase',
    hide: true
  })
}

export default columns


