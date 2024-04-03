import BatteryFullIcon from '@mui/icons-material/BatteryFull'
import Battery90Icon from '@mui/icons-material/Battery90'
import Battery80Icon from '@mui/icons-material/Battery80'
import Battery60Icon from '@mui/icons-material/Battery60'
import Battery50Icon from '@mui/icons-material/Battery50'
import Battery30Icon from '@mui/icons-material/Battery30'
import Battery20Icon from '@mui/icons-material/Battery20'
import Tooltip from '@mui/material/Tooltip'
import { styled } from '@mui/system'

const IconWrapper = styled('div')({
  position: 'relative',
  display: 'inline-block',
})

const BatteryEmptyIcon = styled(BatteryFullIcon)({
  fill: '#c2c2c2'
})

const BatteryIcon = ({ batteryPerc }) => {
  const title = batteryPerc + '%'

  return (
    <Tooltip title={title} componentsProps={{ tooltip: { sx: { background: '#000' } } }} placement="top">
      <IconWrapper>
        {batteryPerc == 100 && <BatteryFullIcon />}
        {batteryPerc < 100 && batteryPerc >= 90 && <Battery90Icon />}
        {batteryPerc < 90 && batteryPerc >= 80 && <Battery80Icon />}
        {batteryPerc < 80 && batteryPerc >= 60 && <Battery60Icon />}
        {batteryPerc < 60 && batteryPerc >= 50 && <Battery50Icon />}
        {batteryPerc < 50 && batteryPerc >= 30 && <Battery30Icon />}
        {batteryPerc < 30 && batteryPerc > 0 && <Battery20Icon />}
        {batteryPerc == 0 && <BatteryEmptyIcon />}
      </IconWrapper>
    </Tooltip>
  )
}

export default BatteryIcon