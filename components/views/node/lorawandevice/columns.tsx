import * as formatters from '/components/views/node/lorawandevice/deviceFormatters'

const lorawandeviceCols = [/*{
    id: 'status',
    label: 'Status',
    format: formatters.status,
    width: '1px'
  },*/{
    id: 'device_name',
    label: 'Name'
  }, {
    id: 'deveui',
    label: 'DevEUI'
  }, {
    id: 'last_seen_at',
    label: 'Last Seen At'
  },
  {
    id: 'battery_level',
    label: 'Battery Level'
  },
  {
    id: 'margin',
    label: 'Margin'
  },
  {
    id: 'expected_uplink_interval_sec',
    label: 'Expected uplink interval (sec)'
  }]


export default lorawandeviceCols