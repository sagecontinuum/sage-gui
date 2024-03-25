import * as formatters from '/components/views/node/lorawandevice/deviceFormatters'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import Tooltip from '@mui/material/Tooltip'

const lorawandeviceCols = [{
  id: 'last_seen_at',
  label: 'Status',
  format: formatters.status,
  width: '1px'
},{
  id: 'name',
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
  label: (
    <Tooltip title="Represents the difference between Max measured SNR at the gateway and
     Min SNR needed to demodulate a message at a specific data rate. It indicates the 
     quality of the received signal compared to background noise." placement="bottom">
      <span>Margin<InfoOutlinedIcon fontSize="small" /></span>
    </Tooltip>
  )
},
{
  id: 'rssi',
  label: (
    <Tooltip title="Signal strength calculated from RSSI. 
    Column disabled if no RSSI values are sent." placement="bottom">
      <span>Signal Strength<InfoOutlinedIcon fontSize="small" /></span>
    </Tooltip>
  ),
  format: formatters.signal,
  width: '200px'
}]


export default lorawandeviceCols