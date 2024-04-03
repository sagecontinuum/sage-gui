import SignalCellularAlt1BarIcon from '@mui/icons-material/SignalCellularAlt1Bar'
import SignalCellularAlt2BarIcon from '@mui/icons-material/SignalCellularAlt2Bar'
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt'
import Tooltip from '@mui/material/Tooltip'
import { makeStyles } from '@mui/styles'

const useStyles = makeStyles(() => ({
  iconWrapper: {
    position: 'relative',
    display: 'inline-block',
  },
  baseIcon: {
    fill: 'none',
    stroke: 'black',
    strokeWidth: 0.5 
  },
  overlayIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
}))

const SignalIcon = ({bars}) => {
  const classes = useStyles()
  const title =
    bars === 3 ? 'Strong Signal' :
      bars === 2 ? 'Moderate Signal' :
        bars === 1 ? 'Weak Signal' : 'No Signal'
  return (
    <Tooltip
      title={title}
      componentsProps={{tooltip: { sx: { background: '#000' }}}}
      placement="top"
    >
      <div className={classes.iconWrapper}>
        <SignalCellularAltIcon className={classes.baseIcon} />
        {bars === 3 && <SignalCellularAltIcon className={classes.overlayIcon} />}
        {bars === 2 && <SignalCellularAlt2BarIcon className={classes.overlayIcon} />}
        {bars === 1 && <SignalCellularAlt1BarIcon className={classes.overlayIcon} />}
      </div>
    </Tooltip>
  )
}

export default SignalIcon