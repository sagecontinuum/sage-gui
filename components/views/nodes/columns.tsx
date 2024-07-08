/* eslint-disable react/display-name */
import settings from '/components/settings'
import * as formatters from '/components/views/nodes/nodeFormatters'
import type { Column } from '/components/table/Table'

const PROJECT = settings.project?.toLowerCase()


const columns: Column[] = [{
  id: 'status',
  label: 'Status',
  format: formatters.statusWithPhase,
  width: '1px'
}, {
  id: 'vsn',
  label: 'Node',
  format: formatters.vsnLink // vsnLinkWithEdit is used if permissions are found
}, {
  id: 'type',
  label: 'Type',
  hide: PROJECT != 'sage'
}, {
  id: 'focus',
  label: 'Focus',
  format: formatters.focus
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
  format: formatters.gps,
  dlFormat: (_, obj) => (obj.lat && obj.lng) ? `${obj.lat}, ${obj.lng}` : ''
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
  format: (val) => <formatters.HardwareList data={val} path="/sensors/" />,
  dlFormat: (val) => val.map(v => v.hw_model).join(', ')
}, {
  id: 'computes',
  label: 'Computes',
  format: (val) => <formatters.HardwareList data={val} />,
  dlFormat: (val) => val.map(v => v.hw_model).join(', '),
  width: '200px',
  hide: true
},
/* todo: update db
{
  id: 'commissioned_at',
  label: 'Commission Date',
},
*/ {
  id: 'modem_model',
  label: 'Modem',
  format: formatters.modem,
  hide: true
}, {
  id: 'modem_sim',
  label: 'Modem Sim',
  format: formatters.modemSim,
  hide: true
}]


if (PROJECT != 'sage') {
  columns.splice(4, 0, {
    id: 'phase',
    label: 'Phase',
    hide: true
  })
}

export default columns


