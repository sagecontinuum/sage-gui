import * as formatters from '/components/views/node/lorawandevice/deviceFormatters'
import {Link} from 'react-router-dom'

const lorawandeviceCols = [{
  id: 'last_seen_at',
  label: 'Status',
  format: formatters.status,
  width: '70px'
},{
  id: 'name',
  label: 'Name'
},{
  id: 'hw_model',
  label: 'Model',
  format: (val) =>
    <Link to={`/sensors/${val}`}>
      {val}
    </Link>
},{
  id: 'deveui',
  label: formatters.LabelWithTooltip(
    'DevEUI',
    'A unique 64 bit device identifier assigned by the manufacturer.'),
},
{
  id: 'battery_level',
  label: 'Battery Level',
  format: formatters.power
},
{
  id: 'margin',
  label: formatters.LabelWithTooltip(
    'Margin',
    <span>
      Indicates the quality of the received signal compared to background noise using the 
      difference between Max measured 
      <a 
        href="https://www.thethingsnetwork.org/docs/lorawan/rssi-and-snr/#snr" 
        target="_blank" 
        rel="noreferrer"> SNR </a>  
      at the gateway and Min SNR needed to demodulate a message at a specific data rate.
    </span> )
},
{
  id: 'rssi',
  label: formatters.LabelWithTooltip(
    'Signal Strength',
    <span>
      Determined by 
      <a 
        href="https://www.thethingsnetwork.org/docs/lorawan/rssi-and-snr/#rssi" 
        target="_blank" 
        rel="noreferrer"> RSSI</a>. 
      Column disabled if signal.rssi values are not being collected. 
    </span> ),
  format: formatters.signal,
  width: '200px'
}]


export default lorawandeviceCols