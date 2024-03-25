import * as formatters from '/components/views/node/lorawandevice/deviceFormatters'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import Tooltip from '@mui/material/Tooltip'

const lorawandeviceCols = [{
  id: 'last_seen_at',
  label: 'Status',
  format: formatters.status,
  width: '70px'
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
    <Tooltip
      title={
        <span>
          Indicates the quality of the received signal compared to background noise using the 
          difference between Max measured 
          <a 
            href="https://www.thethingsnetwork.org/docs/lorawan/rssi-and-snr/#snr" 
            target="_blank" 
            rel="noreferrer"> SNR </a>  
          at the gateway and Min SNR needed to demodulate a message at a specific data rate.
        </span>
      }
      placement="bottom"
    >
      <span>Margin<InfoOutlinedIcon fontSize="small" /></span>
    </Tooltip>
  ),
},
{
  id: 'rssi',
  label: (
    <Tooltip
      title={
        <span>
          Determined by 
          <a 
            href="https://www.thethingsnetwork.org/docs/lorawan/rssi-and-snr/#rssi" 
            target="_blank" 
            rel="noreferrer"> RSSI</a>. 
          Column disabled if no RSSI values are sent. 
        </span>
      }
      placement="bottom"
    >
      <span>Signal Strength<InfoOutlinedIcon fontSize="small" /></span>
    </Tooltip>
  ),
  format: formatters.signal,
  width: '200px'
}]


export default lorawandeviceCols