import styled from 'styled-components'
import CheckIcon from '@mui/icons-material/CheckCircleRounded'
import ErrorIcon from '@mui/icons-material/ErrorOutlineRounded'
import InactiveIcon from '@mui/icons-material/RemoveCircleOutlineOutlined'
import QuestionIcon from '@mui/icons-material/HelpOutline'
import SignalIcon from '/components/views/node/lorawandevice/SignalIcon'
import PowerIcon from '@mui/icons-material/Power'
import BatteryIcon from '/components/views/node/lorawandevice/BatteryIcon'
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

  if (val === -1) {
    return (
      <Tooltip
        title='External Power-Source'
        componentsProps={{ tooltip: { sx: { background: '#000' } } }}
        placement="top"
      >
        <PowerIcon />
      </Tooltip>
    )
  } else if (val >= 0 && val <= 100) {
    return <BatteryIcon batteryPerc={val} />
  } else {
    return '-'
  }
}

export function LabelWithTooltip(label: string, tooltip: ReactNode) {
  return (
    <Tooltip
      title={<TooltipTitle>{tooltip}</TooltipTitle>}
      placement="bottom"
    >
      <span>{label}<InfoIcon /></span>
    </Tooltip>
  )
}

const TooltipTitle = styled.div`
  a {
    color: #4ed6ff;
    font-weight: bold;
  }
  a:hover {
    color: #f2f2f2;
    text-decoration: underline
  }
`

const InfoIcon = styled(InfoOutlinedIcon)`
  width: 15px;
`


export function datasheet(val) {
  return (val ? <a href={val} target="_blank" rel="noreferrer"><DescriptionIcon/></a> : '-')
}
