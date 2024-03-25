import CheckIcon from '@mui/icons-material/CheckCircleRounded'
import ErrorIcon from '@mui/icons-material/ErrorOutlineRounded'
import InactiveIcon from '@mui/icons-material/RemoveCircleOutlineOutlined'
import QuestionIcon from '@mui/icons-material/HelpOutline'
import SignalCellularConnectedNoInternet0BarIcon from '@mui/icons-material/SignalCellularConnectedNoInternet0Bar'
import SignalCellularAlt1BarIcon from '@mui/icons-material/SignalCellularAlt1Bar'
import SignalCellularAlt2BarIcon from '@mui/icons-material/SignalCellularAlt2Bar'
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt'

import Tooltip from '@mui/material/Tooltip'

export function status(val,obj) {
  if(!val || val == '1970-01-01T00:00:00Z'){
    return (
      <Tooltip
        title={`No activity`}
        componentsProps={{tooltip: { sx: { background: '#000' }}}}
        placement="top"
      >
        <InactiveIcon className="inactive status-icon" />
      </Tooltip>
    )
  }

  const lastSeenDate = new Date(val)
  const currentTime = new Date().getTime()
  const formattedLastSeenDate = lastSeenDate.toLocaleString(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  let icon
  let interval_tooltip

  if(obj.expected_uplink_interval_sec === null || obj.expected_uplink_interval_sec === undefined){
    interval_tooltip = 'Expected Interval: Not set'
    icon = <QuestionIcon className="QuestionIcon status-icon" /> 
  } else {
    const expectedLastSeenTime = new Date(currentTime - obj.expected_uplink_interval_sec * 1000)

    if (lastSeenDate >= expectedLastSeenTime) {
      icon = <CheckIcon className="success status-icon" />
    } else {
      icon = <ErrorIcon className="failed status-icon" />
    }

    interval_tooltip = `Expected Interval: ${obj.expected_uplink_interval_sec} sec`
  }

  return (
    <Tooltip
      title={
        <>
          Last Seen: {formattedLastSeenDate}<br/>
          {interval_tooltip}
        </>
      }
      componentsProps={{tooltip: { sx: { background: '#000' }}}}
      placement="top"
    >
      {icon}
    </Tooltip>
  )
}

export function signal(val) {
  if(!val){
    return
  }

  let icon
  let title

  if(val >= -30) {
    title = 'Strong Signal'
    icon = <SignalCellularAltIcon />
  } else if(val < -30 || val >= -75) {
    title = 'Moderate Signal'
    icon = <SignalCellularAlt2BarIcon />
  } else if(val < -75 || val >= -120) {
    title = 'Weak Signal'
    icon = <SignalCellularAlt1BarIcon />
  } else {
    title = 'No Signal'
    icon = <SignalCellularConnectedNoInternet0BarIcon />
  }

  return (
    <Tooltip
      title={title}
      componentsProps={{tooltip: { sx: { background: '#000' }}}}
      placement="top"
    >
      {icon}
    </Tooltip>
  )
}