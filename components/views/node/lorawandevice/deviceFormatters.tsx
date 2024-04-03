import styled from 'styled-components'
import CheckIcon from '@mui/icons-material/CheckCircleRounded'
import ErrorIcon from '@mui/icons-material/ErrorOutlineRounded'
import InactiveIcon from '@mui/icons-material/RemoveCircleOutlineOutlined'
import QuestionIcon from '@mui/icons-material/HelpOutline'
import SignalIcon from '/components/views/node/lorawandevice/SignalIcon'
import PowerIcon from '@mui/icons-material/Power'
import BatteryFullIcon from '@mui/icons-material/BatteryFull'
import Battery90Icon from '@mui/icons-material/Battery90'
import Battery80Icon from '@mui/icons-material/Battery80'
import Battery60Icon from '@mui/icons-material/Battery60'
import Battery50Icon from '@mui/icons-material/Battery50'
import Battery30Icon from '@mui/icons-material/Battery30'
import Battery20Icon from '@mui/icons-material/Battery20'
import Battery0BarRoundedIcon from '@mui/icons-material/Battery0BarRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined'
import { ReactNode } from 'react'

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
    return '-'
  }

  const bars =
    val >= -30 ? 3 :
      val < -30 && val >= -75 ? 2 :
        val < -75 && val >= -120 ? 1 : 0

  return (
    <SignalIcon bars={bars}/>
  )
}

export function power(val) {
  if(!val && val != 0){
    return '-'
  }

  let icon
  let title

  if(val == -1) {
    title = 'External Power-Source'
    icon = <PowerIcon />
  } else if(val == 100) {
    title = val + '%'
    icon = <BatteryFullIcon />
  } else if(val < 100 && val >= 90) {
    title = val + '%'
    icon = <Battery90Icon />
  } else if(val < 90 && val >= 80) {
    title = val + '%'
    icon = <Battery80Icon />
  } else if(val < 80 && val >= 60) {
    title = val + '%'
    icon = <Battery60Icon />
  } else if(val < 60 && val >= 50) {
    title = val + '%'
    icon = <Battery50Icon />
  } else if(val < 50 && val >= 30) {
    title = val + '%'
    icon = <Battery30Icon />
  } else if(val < 30 && val > 0) {
    title = val + '%'
    icon = <Battery20Icon />
  } else if(val == 0) {
    title = val + '%'
    icon = <Battery0BarRoundedIcon />
  } else {
    return '-'
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

export function LabelWithTooltip(label: string, tooltip: ReactNode) {
  return (
    <Tooltip
      title={tooltip}
      placement="bottom"
    >
      <span>{label}<InfoIcon /></span>
    </Tooltip>
  )
}

export function datasheet(val) {
  return (val ? <a href={val} target="_blank" rel="noreferrer"><DescriptionIcon/></a> : '-')
}

const InfoIcon = styled(InfoOutlinedIcon)`
  width: 15px;
`