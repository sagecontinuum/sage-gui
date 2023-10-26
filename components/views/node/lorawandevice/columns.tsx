import * as formatters from '/components/views/node/lorawandevice/deviceFormatters'

const lorawandeviceCols = [{
    id: 'last_seen_at',
    label: 'Status',
    format: formatters.status,
    width: '1px'
  },{
    id: 'device_name',
    label: 'Name'
  }, {
    id: 'deveui',
    label: 'DevEUI'
  },
  {
    id: 'battery_level',
    label: 'Battery Level'
  },
  {
    id: 'margin',
    label: 'Margin'
  }]

  const lorawandeviceCols_temp = [{
    id: 'device_name',
    label: 'Name'
  }, {
    id: 'deveui',
    label: 'DevEUI'
  }]


export default lorawandeviceCols_temp