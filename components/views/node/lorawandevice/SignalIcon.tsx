import SignalCellularAlt1BarIcon from '@mui/icons-material/SignalCellularAlt1Bar'
import SignalCellularAlt2BarIcon from '@mui/icons-material/SignalCellularAlt2Bar'
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt'
import Tooltip from '@mui/material/Tooltip'
import { styled } from '@mui/system'

const IconWrapper = styled('div')({
  position: 'relative',
  display: 'inline-block',
})

const BaseIcon = styled(SignalCellularAltIcon)({
  fill: 'none',
  stroke: 'black',
  strokeWidth: 0.5,
})

const OverlayIcon = styled('div')({
  position: 'absolute',
  top: 0,
  left: 0,
  zIndex: 1,
})

const SignalIcon = ({ bars }) => {
  const title =
    bars === 3 ? 'Strong Signal' :
      bars === 2 ? 'Moderate Signal' :
        bars === 1 ? 'Weak Signal' : 'No Signal'
  return (
    <Tooltip title={title} componentsProps={{ tooltip: { sx: { background: '#000' } } }} placement="top">
      <IconWrapper>
        <BaseIcon />
        <OverlayIcon>
          {bars === 3 && <SignalCellularAltIcon />}
          {bars === 2 && <SignalCellularAlt2BarIcon />}
          {bars === 1 && <SignalCellularAlt1BarIcon />}
        </OverlayIcon>
      </IconWrapper>
    </Tooltip>
  )
}

export default SignalIcon