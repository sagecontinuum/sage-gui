import { forwardRef, useState, memo } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

import {
  IconButton, Badge, Tooltip, Popper, ClickAwayListener,
  List, ListItem, ListItemText, Button, ButtonGroup, SvgIcon
} from '@mui/material'
import type { SvgIconProps } from '@mui/material/SvgIcon'
import { useTheme } from '@mui/material/styles'
import {
  FilePresentOutlined,
  TerminalOutlined,
  ViewTimelineOutlined
} from '@mui/icons-material'

import {
  CheckRounded, CheckCircleRounded, ReportProblemOutlined,
  PendingOutlined, ErrorOutlineRounded, RoomOutlined, Edit, LaunchRounded,
  CameraAltOutlined, Whatshot
} from '@mui/icons-material'

import { NODE_STATUS_RANGE } from '/components/apis/beehive'
import NodeLastReported from '/components/utils/NodeLastReported'
import Dot from '/components/utils/Dot'
import { capabilityIcons } from '../sensor/capabilityIcons'
import { CapabilityIconContainer, DisabledOverlay } from '../sensor/CapabilityIcon'

import * as utils from '/components/utils/units'
import * as BK from '/components/apis/beekeeper'
import type { AccessPerm } from '/components/apis/user'
import config from '/config'
import { Box, Typography } from '@mui/material'


export function GPSIcon(props: {obj: BK.Node}) {
  const {hasLiveGPS, hasStaticGPS, lat, lng} = props.obj
  const [copied, setCopied] = useState(false)

  const handleCopyGPS = (evt) => {
    evt.stopPropagation()
    if (lat && lng) {
      navigator.clipboard.writeText(`${lat}, ${lng}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const gpsCoords = (lat && lng) ? `${lat}, ${lng}` : 'No coordinates'

  if (hasStaticGPS) {
    return (
      <Tooltip
        placement="top"
        title={
          <>
            Static GPS
            {hasLiveGPS && <>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<Dot size="8" /> {'=='} recent live GPS found<br/></>}
            <br/>
            {gpsCoords}<br/>
            <small><i>{copied ? 'Copied!' : 'Click to copy'}</i></small>
          </>
        }
      >
        <IconButton size="small" onClick={handleCopyGPS}>
          {copied ? (
            <CheckRounded fontSize="small" />
          ) : (
            <LiveGPSDot invisible={!hasLiveGPS} color="primary" variant="dot">
              <RoomOutlined fontSize="small"/>
            </LiveGPSDot>
          )}
        </IconButton>
      </Tooltip>
    )
  } else if (!hasStaticGPS && hasLiveGPS) {
    return (
      <Tooltip
        placement="top"
        title={
          <>
            Live GPS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(no static gps found)<br/>
            <br/>
            {gpsCoords}<br/>
            <small><i>{copied ? 'Copied!  ' : 'Click to copy'}</i></small>
          </>
        }
      >
        <IconButton size="small" onClick={handleCopyGPS}>
          {copied ? (
            <CheckRounded fontSize="small" />
          ) : (
            <RoomOutlined fontSize="small" style={{color: '#36b8ff'}}/>
          )}
        </IconButton>
      </Tooltip>
    )
  }

  return <></>
}


const LiveGPSDot = styled(Badge)`
  .MuiBadge-badge {
    right: 3px;
    top: 2px;
    padding: 0px;
  }
`

const ThermalCameraIcon = () => (
  <div style={{position: 'relative', display: 'inline-flex', alignItems: 'center'}}>
    <CameraAltOutlined fontSize='small'/>
    <Whatshot
      fontSize="inherit"
      sx={{
        position: 'absolute',
        top: -2,
        right: -2,
        background: ({palette}) => palette.background.paper,
        color: ({palette}) => palette.error.main,
      }}
    />
  </div>
)


type SensorIconsProps = {
  data: BK.Node['sensors'] | BK.Node['computes']
  showOnlyPresent?: boolean
}

export const SensorIcons = memo(function SensorIcons({data, showOnlyPresent = false}: SensorIconsProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [popoverSensors, setPopoverSensors] = useState<{hw_model: string, name: string, isThermal: boolean}[]>([])
  const [popoverCapability, setPopoverCapability] = useState<string>('')

  // Count sensors by capability and track thermal cameras
  const capabilityCounts = new Map<string, typeof data>()
  const sensorCapabilityMap = new Map<string, Set<string>>()

  data.forEach(sensor => {
    sensorCapabilityMap.set(sensor.hw_model, new Set(sensor.capabilities))

    // If sensor has no capabilities, add to Special
    if (!sensor.capabilities || sensor.capabilities.length === 0) {
      if (!capabilityCounts.has('Additional Sensors/Capabilities')) {
        capabilityCounts.set('Additional Sensors/Capabilities', [])
      }
      if (!capabilityCounts.get('Additional Sensors/Capabilities').some(s => s.hw_model === sensor.hw_model)) {
        capabilityCounts.get('Additional Sensors/Capabilities').push(sensor)
      }
    } else {
      sensor.capabilities?.forEach(cap => {
        // Merge Camera and Thermal Camera into Camera
        const normalizedCap = cap === 'Thermal Camera' ? 'Camera' : cap
        if (!capabilityCounts.has(normalizedCap)) {
          capabilityCounts.set(normalizedCap, [])
        }
        if (!capabilityCounts.get(normalizedCap).some(s => s.hw_model === sensor.hw_model)) {
          capabilityCounts.get(normalizedCap).push(sensor)
        }
      })
    }
  })

  const hasThermalCamera = data.some(sensor =>
    sensor.capabilities?.includes('Thermal Camera')
  )

  const handleClick = (event: React.MouseEvent<HTMLElement>, capability: string, sensors: typeof data) => {
    event.stopPropagation()
    if (sensors && sensors.length > 0) {
      setAnchorEl(event.currentTarget)
      // For Camera capability, check if each sensor is thermal
      const sensorsWithType = sensors.map(sensor => ({
        hw_model: sensor.hw_model,
        name: sensor.name,
        isThermal: sensorCapabilityMap.get(sensor.hw_model)?.has('Thermal Camera') || false
      }))
      setPopoverSensors(sensorsWithType)
      setPopoverCapability(capability)
    }
  }

  const handleClose = () => {
    setAnchorEl(null)
    setPopoverSensors([])
    setPopoverCapability('')
  }

  const open = Boolean(anchorEl)

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          rowGap: { xs: 0.5, sm: 0.75 }
        }}
      >
        {Object.keys(capabilityIcons).map(capability => {
          const Icon = capabilityIcons[capability]
          const sensors = capabilityCounts.get(capability)
          const count = sensors ? sensors.length : 0
          const isPresent = count > 0

          // Don't show Additional Sensors/Capabilities icon if there aren't any
          if (capability === 'Additional Sensors/Capabilities' && !isPresent) {
            return null
          }

          // Skip non-present capabilities if showOnlyPresent is true
          if (showOnlyPresent && !isPresent) {
            return null
          }

          // Use ThermalCameraIcon for Camera if any thermal cameras exist
          const DisplayIcon = (capability === 'Camera' && hasThermalCamera) ? ThermalCameraIcon : Icon

          // For Camera capability, count regular vs thermal
          let cameraBreakdown = ''
          if (capability === 'Camera' && isPresent) {
            const thermalCount = sensors.filter(sensor =>
              sensorCapabilityMap.get(sensor.hw_model)?.has('Thermal Camera')
            ).length
            const regularCount = count - thermalCount
            if (thermalCount > 0 && regularCount > 0) {
              cameraBreakdown = ` (${regularCount} regular, ${thermalCount} thermal)`
            } else if (thermalCount > 0) {
              cameraBreakdown = ` (${thermalCount} thermal)`
            }
          }

          return (
            <Tooltip
              key={capability}
              disableInteractive
              enterDelay={0}
              title={
                isPresent ? (
                  <>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      gap: '16px',
                      marginBottom: '8px',
                      paddingBottom: '8px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.3)'
                    }}>
                      <span style={{fontSize: '1.1em'}}>
                        <strong>{capability}</strong> {count > 1 && `(${count} total)`}
                      </span>
                      {cameraBreakdown && (
                        <strong style={{
                          whiteSpace: 'nowrap',
                          fontSize: '0.9em'}}
                        >
                          {cameraBreakdown.trim().replace(/[()]/g, '')}
                        </strong>
                      )}
                    </div>
                    <div style={{
                      marginTop: '8px',
                      display: 'flex',
                      gap: '12px',
                      flexWrap: 'wrap',
                      alignItems: 'flex-start'
                    }}>
                      {sensors.map((sensor, idx) => (
                        <>
                          {idx > 0 && <span style={{opacity: 0.5}}>|</span>}
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong>{sensor.hw_model}</strong>
                            {sensor.hw_model.toLowerCase() !== sensor.name.toLowerCase() && (
                              <small style={{opacity: 0.8, whiteSpace: 'nowrap'}}>{sensor.name}</small>
                            )}
                          </div>
                        </>
                      ))}
                    </div>
                    <small style={{marginTop: '8px', display: 'block', opacity: 0.7}}><i>Click for details</i></small>
                  </>
                ) : (
                  <><strong>{capability}</strong><br/><small>(not present)</small></>
                )
              }
              placement="top"
              slotProps={{
                tooltip: {
                  sx: { fontSize: '.8rem' }
                }
              }}
            >
              <Box
                onClick={(e) => handleClick(e, capability, sensors)}
                sx={(theme) => ({
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  minWidth: '28px',
                  position: 'relative',
                  opacity: isPresent ? 1 : 0.3,
                  filter: isPresent ? 'none' : 'grayscale(100%)',
                  cursor: isPresent ? 'pointer' : 'default',
                  color: isPresent ? theme.palette.mode === 'dark' ?
                    '#fff' : '#000' : theme.palette.mode === 'dark' ? '#555' : '#aaa',
                  '&:hover': isPresent ? {
                    color: theme.palette.primary.main
                  } : {}
                })}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <DisplayIcon
                    fontSize="small"
                  />
                  {!isPresent && (
                    <Box
                      sx={(theme) => ({
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '120%',
                        height: '2px',
                        bgcolor: theme.palette.mode === 'dark' ? '#555' : '#aaa',
                        transform: 'translate(-50%, -50%) rotate(-45deg)',
                        pointerEvents: 'none'
                      })}
                    />
                  )}
                </Box>
                {count > 1 && <Box sx={{fontSize: '0.7em', fontWeight: 500, minWidth: '16px'}}>x{count}</Box>}
                {count <= 1 && <Box sx={{fontSize: '0.7em', minWidth: '16px', visibility: 'hidden'}}>x1</Box>}
              </Box>
            </Tooltip>
          )
        })}
      </Box>

      <ClickAwayListener onClickAway={handleClose}>
        <Popper
          open={open}
          anchorEl={anchorEl}
          placement="bottom-end"
          disablePortal={false}
          sx={{zIndex: 1300}}
        >
          <List dense sx={{ minWidth: 200, py: 1, bgcolor: 'background.paper', boxShadow: 1 }}>
            <ListItem sx={{ pb: 1, borderBottom: 1, borderColor: 'divider' }}>
              <ListItemText
                primary={popoverCapability}
                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9em' }}
              />
            </ListItem>
            {popoverSensors.map((sensor, idx) => {
              const SensorIcon = popoverCapability === 'Camera'
                ? (sensor.isThermal ? ThermalCameraIcon : CameraAltOutlined)
                : null

              return (
                <ListItem
                  key={idx}
                  component={Link}
                  to={`/sensors/${sensor.hw_model}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    '&:hover': {
                      bgcolor: 'action.hover',
                      textDecoration: 'none'
                    }
                  }}
                >
                  {SensorIcon && (
                    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 24 }}>
                      <SensorIcon fontSize="small" />
                    </Box>
                  )}
                  <ListItemText
                    primary={sensor.hw_model}
                    secondary={sensor.name}
                    slotProps={{
                      primary: { fontSize: '0.9em', fontWeight: 600 },
                      secondary: { fontSize: '0.75em' }
                    }}
                  />
                </ListItem>
              )
            })}
          </List>
        </Popper>
      </ClickAwayListener>
    </>
  )
})


export function status(val, obj) {
  if (!obj.elapsedTimes) {
    return (
      <Tooltip
        title={`No sys.uptime(s) in ${NODE_STATUS_RANGE}`}
        componentsProps={{tooltip: {sx: {background: '#000'}}}}
        placement="top">
        <ReportProblemOutlined className="inactive status-icon" />
      </Tooltip>
    )
  }

  let icon
  if (val == 'reporting')
    icon = <CheckCircleRounded className="success status-icon" />
  else
    icon = <ErrorOutlineRounded className="failed status-icon" />

  return (
    <Tooltip
      title={
        <>
          Last reported metric<br/>
          <NodeLastReported computes={obj.computes} elapsedTimes={obj.elapsedTimes} />
        </>
      }
      componentsProps={{tooltip: {sx: {background: '#000'}}}}
      placement="top"
    >
      {icon}
    </Tooltip>
  )
}


const phaseNotes = {
  Maintenance: 'In Maintenance'
}

const HalfStatusCheckIcon = forwardRef<SVGSVGElement, SvgIconProps>(function HalfStatusCheckIcon(props, ref) {
  const theme = useTheme()
  const isDarkMode = theme.palette.mode === 'dark'
  const leftCheckFill = isDarkMode ? '#000' : '#fff'
  const rightCheckFill = isDarkMode ? '#3ac37e' : '#3ac37e'

  return (
    <SvgIcon ref={ref} viewBox="0 0 24 24" {...props}>
      <defs>
        <linearGradient id="half-status-check-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="50%" stopColor={leftCheckFill} />
          <stop offset="50%" stopColor={rightCheckFill} />
        </linearGradient>
      </defs>
      <path d="M12 2a10 10 0 0 0 0 20V2z" fill="#3ac37e" />
      <path
        d="M12 2 A10 10 0 0 0 12 22"
        fill="none"
        stroke="#3ac37e"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 2 A10 10 0 0 1 12 22"
        fill="none"
        stroke="#3ac37e"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M10 14.2 7.8 12a1 1 0 1 0-1.4 1.4l2.9 2.9a1 1 0 0 0 1.4 0l6.9-6.9a1 1 0 1 0-1.4-1.4z"
        fill="url(#half-status-check-gradient)"
      />
    </SvgIcon>
  )
})

export function statusWithPhase(val, obj) {
  const phase = obj.phase
  const phaseTitle = phaseNotes[phase] || phase

  let icon
  if (phase == 'Deployed' && val == 'reporting')
    icon = <CheckCircleRounded className="success status-icon" />
  else if (phase == 'Deployed' && val != 'reporting')
    icon = <ErrorOutlineRounded className="failed status-icon" />
  else if (phase == 'Maintenance')
    icon = <ReportProblemOutlined className="in-progress status-icon" />
  else if ((phase == 'Awaiting Deployment' || phase == 'Pending') && val == 'reporting')
    icon = <HalfStatusCheckIcon className="status-icon" />
  else if ((phase == 'Awaiting Deployment' || phase == 'Pending') && val != 'reporting')
    icon = <PendingOutlined className="inactive status-icon" />
  else
    icon = <PendingOutlined className="inactive status-icon" />


  return (
    <Tooltip
      title={
        <>
          <b>{phaseTitle}</b><br/>
          {(phase == 'Deployed' || phase == 'Awaiting Deployment' || phase == 'Shipment Pending') &&
            <div>
              <br/>
              Last reported metrics:<br/>
              {obj.elapsedTimes ?
                <NodeLastReported computes={obj.computes} elapsedTimes={obj.elapsedTimes} /> :
                `No sys.uptime(s) in ${NODE_STATUS_RANGE}`
              }
            </div>
          }
        </>
      }
      componentsProps={{tooltip: {sx: {background: '#000'}}}}
      placement="top"
    >
      {icon}
    </Tooltip>
  )
}


export function vsn(vsn, node) {
  const {site_id} = node
  return <Link to={`/nodes/${vsn}`}>
    {site_id || vsn}
  </Link>
}

export function vsnLink(vsn, node: BK.Node) {
  const {site_id} = node
  return <Link to={`/nodes/${vsn}`}>
    {site_id || vsn} <small className="muted">{site_id && `${vsn}` }</small>
  </Link>
}

export function vsnLinkWithEdit(vsn, node: BK.Node) {
  const {site_id} = node
  return <div className="flex items-center no-wrap">
    <Link to={`/nodes/${vsn}`}>
      {site_id || vsn} <small className="muted">{site_id && `${vsn}` }</small>
    </Link>
    <Tooltip
      placement="top"
      title={<>Edit node meta <LaunchRounded style={{fontSize: '1.1em'}}/></>}
      className="edit-btn" // show/hide on hover with css
    >
      <IconButton
        href={`${config.auth}/admin/manifests/nodedata/${node.id}`}
        onClick={(evt) => evt.stopPropagation()}
        target="_blank" rel="noreferrer" size="small">
        <Edit fontSize="small"/>
      </IconButton>
    </Tooltip>
  </div>
}


export function vsnLinkNameOnly(vsn, node: BK.Node) {
  const {site_id} = node
  return <Link to={`/nodes/${vsn}`}>
    {site_id || vsn}
  </Link>
}

export function vsnToDisplayName(vsn, node: BK.Node) {
  const {site_id} = node
  return <>
    {site_id || vsn}&nbsp;<small className="muted">{site_id && vsn}</small>
  </>
}

export function vsnToDisplayStr(vsn, site_id) {
  return `${site_id || vsn}${site_id ? ` | ${vsn}` : ''}`
}

export function vsnToDisplayStrAlt(vsn, site_id) {
  return `${site_id || vsn}${site_id ? ` (${vsn})` : ''}`
}


export function focus(focus, {partner}) {
  return (!focus && !partner) ? '-' :
    `${focus ? focus : ''}${partner ? ` (${partner})` : ''}`
}


export function gps(_, obj, newline = false) {
  return <div className="flex items-center">
    <span className="gps-icon"><GPSIcon obj={obj} /></span>

    {(!obj.lat || !obj.lng) ?
      '-' :
      `${obj.lat},` + (newline ? '\n' : '') + `${obj.lng}`
    }
  </div>
}


export function lastUpdated(elapsedTimes, obj) {
  if (!elapsedTimes) return '-'

  return <NodeLastReported computes={obj.computes} elapsedTimes={elapsedTimes} />
}


export function uptimes(val) {
  if (!val) return '-'

  return Object.keys(val).map(host =>
    <div key={host}>{utils.prettyTime(val[host])}</div>
  )
}

// todo(nc): use new /nodes endpoint?
export function modem(_, obj) {
  const hwModel = obj.modem_model
  return (
    <>
      <small className="muted font-bold">
        {obj.modem_carrier ?
          'Cellular Connected' :
          (hwModel ? <i>No Sim Configured</i> : '-')
        }
      </small>
      <div>
        {hwModel && <Link to={`/nodes/${obj.vsn}?tab=peripherals`}>{hwModel}</Link>}
      </div>
    </>
  )
}


// details on a sim card for a node
export function modemSim(_, obj: BK.Node) {
  return (
    <>
      <small className="muted"><b>{obj.modem_carrier_name}</b></small>
      <div>
        {obj.modem_carrier || '-'}{' '}
        {obj.modem_sim && <span className="muted">{obj.modem_sim}</span>}
      </div>
    </>
  )
}


type SensorsProps = {
  data: BK.Node['sensors'] | BK.Node['computes']
  path?: string  // url path if avail; e.g., /sesnors/
}

export function HardwareListSimple(props: SensorsProps) {
  const {data, path} = props

  if (!data.length) return <>-</>

  const len = data.length

  return (
    <HardwareRoot>
      {data.map((sensor, i) => {
        const {hw_model, name} = sensor
        return (
          <span key={i}>
            <Tooltip placement="top" title={name}>
              {path ?
                <Link to={`${path}${hw_model}`}>
                  {hw_model}
                </Link> :
                <span>{hw_model}</span>
              }
            </Tooltip>
            {i < len - 1  && ', '}
          </span>
        )
      })
      }
    </HardwareRoot>
  )
}


const HardwareRoot = styled.ul`
  padding: 0;
  font-size: 9pt;
  list-style: none;
  li {
    white-space: nowrap;
  }
`

const capabilityAbbrev: Record<string, string> = {
  'Temperature': 'Temp',
  'Humidity': 'RH',
  'Pressure': 'Pa',
  'Air Quality': 'AQ',
  'Particulate Matter': 'PM',
  'Wind Speed': 'Wind',
  'Wind Direction': 'Dir',
  'Precipitation': 'Precip',
  'Solar Radiation': 'Solar',
  'Microphone': 'Mic'
}

export function HardwareList(props: SensorsProps) {
  const {data, path} = props

  if (!data.length) return <>-</>

  return (
    <Box
      component="ul"
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(4, minmax(0, 1fr))'
        },
        columnGap: { xs: 1.25, sm: 1.5, md: 2 },
        rowGap: { xs: 0.75, sm: 1 },
        listStyle: 'none',
        p: 0,
        m: 0,
        fontSize: '9pt'
      }}
    >
      {data.map((sensor, i) => {
        const {hw_model, name, capabilities} = sensor
        return (
          <Box component="li" key={`${hw_model}-${i}`} sx={{minWidth: 0}}>
            <Tooltip placement="top" title={name}>
              {path ?
                <Link to={`${path}${hw_model}`}>
                  {hw_model}
                </Link> :
                <Box component="span" sx={{whiteSpace: 'nowrap'}}>{hw_model}</Box>
              }
            </Tooltip>
            <Typography className="muted" sx={{fontSize: '8pt', lineHeight: 1.2, mt: 0.25}}>
              {capabilities.map(v => capabilityAbbrev[v] || v).join(', ')}
            </Typography>
          </Box>
        )
      })
      }
    </Box>
  )
}


const TT = (props) =>
  <Tooltip placement="right" {...props}><span>{props.children}</span></Tooltip>



/**
 * helpers for admin listing of sensors by typical WSN positions; todo(nc): remove
 */

export function topSensors(v, obj) {
  const {sensors} = obj
  const sens = sensors.filter(({name}) => name.match(/top|raingauge/gi))

  return <HardwareRoot>
    {sens.map(({name, hw_model, hardware}, i) =>
      <li key={i}>
        <TT title={`${name} | ${hardware}`}>
          <Link to={`/sensors/${hw_model}`}>{hw_model}</Link>
        </TT>
      </li>
    )}
  </HardwareRoot>
}



export function bottomSensors(v, obj) {
  const {sensors} = obj
  const sens = sensors.filter(({name}) => name.match(/bottom/gi))

  return <HardwareRoot>
    {sens.map(({name, hw_model, hardware}, i) =>
      <li key={i}>
        <TT title={`${name} | ${hardware}`}>
          <Link to={`/sensors/${hw_model}`}>{hw_model}</Link>
        </TT>
      </li>
    )}
  </HardwareRoot>
}


export function leftSensors(v, obj) {
  const {sensors} = obj
  const sens = sensors.filter(({name}) => name?.match(/left/gi))

  return <HardwareRoot>
    {sens.map(({name, hw_model, hardware}, i) =>
      <li key={i}>
        <TT title={`${name} | ${hardware}`}>
          <Link to={`/sensors/${hw_model}`}>{hw_model}</Link>
        </TT>
      </li>
    )}
  </HardwareRoot>
}


export function rightSensors(v, obj) {
  const {sensors} = obj
  const sens = sensors.filter(({name, scope}) =>
    (name.match(/right/gi) || (scope || '').match(/^rpi$/i)) && !name.match(/raingauge/gi)
  )

  return <HardwareRoot>
    {sens.map(({name, hw_model, hardware}, i) =>
      <li key={i}>
        <TT title={`${name} | ${hardware}`}>
          <Link to={`/sensors/${hw_model}`}>{hw_model}</Link>
        </TT>
      </li>
    )}
  </HardwareRoot>
}


export function additionalSensors(v, obj) {
  const {sensors} = obj
  const sens = sensors.filter(({name}) =>
    !name?.match(/top|bottom|left|right|gps|bme280|microphone|raingauge|bme680/gi)
  )

  return <HardwareRoot>
    {sens.map(({name, hw_model, hardware}, i) =>
      <li key={i}>
        <TT title={`${name} | ${hardware}`}>
          <Link to={`/sensors/${hw_model}`}>{hw_model}</Link>
        </TT>
      </li>
    )}
  </HardwareRoot>
}


type AccessFilterButtonsProps = {
  accessFilters: Set<AccessPerm>
  onToggle: (perm: AccessPerm) => void
}

export function AccessFilterButtons({ accessFilters, onToggle }: AccessFilterButtonsProps) {
  return (
    <ButtonGroup size="small" variant="outlined">
      <Tooltip title="File (image, audio, etc.) Access" placement="top" arrow>
        <Button
          onClick={() => onToggle('files')}
          variant={accessFilters.has('files') ? 'contained' : 'outlined'}
          startIcon={<FilePresentOutlined />}
        >Files</Button>
      </Tooltip>
      <Tooltip title="Develop / ssh Remote Access" placement="top" arrow>
        <Button
          onClick={() => onToggle('develop')}
          variant={accessFilters.has('develop') ? 'contained' : 'outlined'}
          startIcon={<TerminalOutlined />}
        >Develop</Button>
      </Tooltip>
      <Tooltip title="Job Scheduling Access" placement="top" arrow>
        <Button
          onClick={() => onToggle('schedule')}
          variant={accessFilters.has('schedule') ? 'contained' : 'outlined'}
          startIcon={<ViewTimelineOutlined />}
        >Schedule</Button>
      </Tooltip>
    </ButtonGroup>
  )
}

export function accessFormatter(access: AccessPerm[] = []) {
  const hasFiles = access.includes('files')
  const hasDevelop = access.includes('develop')
  const hasSchedule = access.includes('schedule')

  return (
    <div className="flex items-center gap">
      <Tooltip title="File Access (image, audio, etc.)" placement="top" arrow>
        <CapabilityIconContainer available={hasFiles}>
          <FilePresentOutlined />
          {!hasFiles && <DisabledOverlay />}
        </CapabilityIconContainer>
      </Tooltip>
      <Tooltip title="Develop / ssh Remote Access" placement="top" arrow>
        <CapabilityIconContainer available={hasDevelop}>
          <TerminalOutlined />
          {!hasDevelop && <DisabledOverlay />}
        </CapabilityIconContainer>
      </Tooltip>
      <Tooltip title="Job Scheduling Access" placement="top" arrow>
        <CapabilityIconContainer available={hasSchedule}>
          <ViewTimelineOutlined />
          {!hasSchedule && <DisabledOverlay />}
        </CapabilityIconContainer>
      </Tooltip>
    </div>
  )
}

