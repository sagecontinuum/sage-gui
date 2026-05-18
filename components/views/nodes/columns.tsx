/* eslint-disable react/display-name */
import settings from '/components/settings'
import * as formatters from '/components/views/nodes/nodeFormatters'
import type { Column } from '/components/table/Table'
import type { Node } from '/components/apis/beekeeper'
import {
  sortAlt,
  sortCity,
  sortCommissionedAt,
  sortByComputeCount,
  sortBySensorCapabilitiesCount,
  sortBySensorCount,
  sortByUniqueSensorCapabilityCount,
  sortElapsedTimes,
  sortFocus,
  sortGps,
  sortModemModel,
  sortModemSim,
  sortState,
  sortStatus,
  sortType,
  sortUptimes,
  sortVsn
} from './sorters'

export { accessFormatter } from '/components/views/nodes/nodeFormatters'


const PROJECT = settings.project?.toLowerCase()

const columns: Column<Node>[] = [{
  id: 'status',
  label: 'Status',
  format: formatters.statusWithPhase,
  sort: sortStatus,
  width: '1px'
}, {
  id: 'vsn',
  label: 'Node',
  format: formatters.vsnLinkWithEdit, // vsnLinkWithEdit is used if permissions are found,
  sort: sortVsn,
  width: '138px'
}, {
  id: 'type',
  label: 'Type',
  sort: sortType,
  hide: PROJECT != 'sage'
}, {
  id: 'focus',
  label: 'Focus',
  sort: sortFocus,
  format: formatters.focus
}, {
  id: 'elapsedTimes',
  label: 'Last Reported Metrics',
  sort: sortElapsedTimes,
  format: formatters.lastUpdated,
  hide: true
}, {
  id: 'uptimes',
  label: 'Uptime',
  sort: sortUptimes,
  format: formatters.uptimes,
  hide: true
}, {
  id: 'city',
  label: 'City',
  sort: sortCity,
  hide: true
}, {
  id: 'state',
  label: 'State',
  sort: sortState,
  format: (val, obj) =>
    <div className="flex items-center">
      <formatters.GPSIcon obj={obj} />&nbsp;
      {val || '-'}
    </div>
}, {
  id: 'gps',
  label: 'GPS',
  sort: sortGps,
  format: formatters.gps,
  dlFormat: (_, obj) => (obj.lat && obj.lng) ? `${obj.lat}, ${obj.lng}` : '',
  hide: true
}, {
  id: 'alt',
  label: 'Elevation (m)',
  sort: sortAlt,
  format: (val) => {
    return val || '-'
  },
  hide: true
}, {
  id: 'sensors',
  label: 'Sensors',
  format: (val) => <formatters.HardwareList data={val} path="/sensors/" />,
  initialSortDirection: 'dsc',
  sort: sortBySensorCount,
  dlFormat: (val: Array<{hw_model: string}>) => val.map(({hw_model}) => hw_model).join(', '),
  hide: true
}, {
  id: 'sensorIcons',
  label: 'Sensor Capabilities',
  format: (_, obj) => <formatters.SensorIcons data={obj.sensors} />,
  initialSortDirection: 'dsc',
  sort: sortByUniqueSensorCapabilityCount,
  dlFormat: (_, obj) => {
    const caps = new Set()
    obj.sensors?.forEach(s => s.capabilities?.forEach(c => caps.add(c)))
    return Array.from(caps).sort().join(', ')
  }
}, {
  id: 'sensorModels',
  label: 'Sensor Models',
  format: (_, obj) => <formatters.HardwareListSimple data={obj.sensors} path="/sensors/" />,
  initialSortDirection: 'dsc',
  sort: sortBySensorCount,
  dlFormat: (_, obj) => (obj.sensors as Array<{hw_model: string}>).map(({hw_model}) => hw_model).join(', '),
  hide: true
},{
  id: 'sensorCapabilities',
  label: 'Sensor Capabilities',
  format: (val) => val.join(', '),
  initialSortDirection: 'dsc',
  sort: sortBySensorCapabilitiesCount,
  dlFormat: (val) => val.join(', '),
  hide: true
}, {
  id: 'computes',
  label: 'Computes',
  format: (val) => <formatters.HardwareList data={val} />,
  initialSortDirection: 'dsc',
  sort: sortByComputeCount,
  dlFormat: (val: Array<{hw_model: string}>) => val.map(({hw_model}) => hw_model).join(', '),
  width: '300px',
  hide: true
}, {
  id: 'commissioned_at',
  label: 'Commission Time',
  sort: sortCommissionedAt,
  hide: true,
  format: (val) => val ? new Date(val).toLocaleString() : '-'
}, {
  id: 'modem_model',
  label: 'Modem',
  sort: sortModemModel,
  format: formatters.modem,
  hide: true
}, {
  id: 'modem_sim',
  label: 'Modem Sim',
  sort: sortModemSim,
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


