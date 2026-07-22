
import { MenuItem, Select } from '@mui/material'
import { ListSubheader } from '/components/layout/Layout'
import { compactMenuItemSx, compactSelectSx } from './selectStyles'
import { summerCampNodes } from './NodeSelector'

type CameraOption = {
  label: string
  value: string
  description: string
  nodes: string[]
}

type Props = {
  node: string
  value: string
  onChange: (value: string) => void
}

export const cameraOptions: CameraOption[] = [
  {
    label: 'Hummingbird Camera',
    value: 'http://10.107.0.221:10000/cgi-bin/api.cgi?cmd=Snap&channel=0&rs=abc123&user=sage&password=SageCam!',
    description: 'A camera located at the hummingbird feeder .',
    nodes: ['H00F']
  }, {
    label: 'PTZ (Pan-Tilt-Zoom) Camera',
    value: 'rtsp://10.31.81.27:554/profile1/media.smp',
    description: 'A versatile camera that can pan, tilt, and zoom to capture a wide range of views. '
    + 'Ideal for monitoring large areas or tracking moving subjects.',
    nodes: ['H00F']
  }, {
    label: 'Remote HTTP-Connected Camera',
    value: 'rtsp://130.202.23.153:554/profile1/media.smp',
    description: 'A camera located at ATMOS.',
    nodes: ['H00F']
  }, {
    label: 'Reolink E1 Pro Cam',
    value: 'rtsp://camera:0Bscura%23@10.31.81.44:554/Preview_01_main',
    description: 'Camera for BCN Demo',
    nodes: ['H015']
  }, {
    label: 'EVL 1',
    value: 'rtsp://lookup.sage/camera/evl-1',
    description: 'Summer camp EVL camera 1.',
    nodes: [...summerCampNodes]
  }, {
    label: 'EVL 2',
    value: 'rtsp://lookup.sage/camera/evl-2',
    description: 'Summer camp EVL camera 2.',
    nodes: [...summerCampNodes]
  }, {
    label: 'EVL 3',
    value: 'rtsp://lookup.sage/camera/evl-3',
    description: 'Summer camp EVL camera 3.',
    nodes: [...summerCampNodes]
  }, {
    label: 'EVL 4',
    value: 'rtsp://lookup.sage/camera/evl-4',
    description: 'Summer camp EVL camera 4.',
    nodes: [...summerCampNodes]
  }, {
    label: 'EVL 5',
    value: 'rtsp://lookup.sage/camera/evl-5',
    description: 'Summer camp EVL camera 5.',
    nodes: [...summerCampNodes]
  }, {
    label: 'EVL 6',
    value: 'rtsp://lookup.sage/camera/evl-6',
    description: 'Summer camp EVL camera 6.',
    nodes: [...summerCampNodes]
  }, {
    label: 'EVL 7',
    value: 'rtsp://lookup.sage/camera/evl-7',
    description: 'Summer camp EVL camera 7.',
    nodes: [...summerCampNodes]
  }, {
    label: 'EVL 8',
    value: 'rtsp://lookup.sage/camera/evl-8',
    description: 'Summer camp EVL camera 8.',
    nodes: [...summerCampNodes]
  }, {
    label: 'EVL Eye',
    value: 'rtsp://lookup.sage/camera/evl-eye',
    description: 'Summer camp EVL eye camera.',
    nodes: [...summerCampNodes]
  }, {
    label: 'Eye',
    value: 'rtsp://lookup.sage/camera/eye',
    description: 'Summer camp eye camera.',
    nodes: [...summerCampNodes]
  }]

export const getCameraOptionsForNode = (node: string): CameraOption[] =>
  cameraOptions.filter((camera) => camera.nodes.includes(node))

export const getDefaultCameraValue = (node: string): string =>
  getCameraOptionsForNode(node)[0]?.value || cameraOptions[0]?.value || ''

export default function CameraSelector(props: Props) {
  const { node, value, onChange } = props
  const filteredCameraOptions = getCameraOptionsForNode(node)

  const selectedLabel = filteredCameraOptions.find((camera) => camera.value == value)?.label || value

  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value as string)}
      variant="standard"
      disableUnderline
      renderValue={() => selectedLabel}
      sx={{
        ...compactSelectSx,
        minWidth: 160
      }}
      MenuProps={{
        PaperProps: {
          sx: {
            maxHeight: 340,
            minWidth: 280,
            width: 'fit-content',
            maxWidth: 460,
            '& .MuiMenuItem-root': {
              whiteSpace: 'normal',
              alignItems: 'flex-start'
            }
          }
        }
      }}
    >
      <ListSubheader>camera source</ListSubheader>
      {filteredCameraOptions.map((camera) => (
        <MenuItem key={camera.value} value={camera.value} sx={compactMenuItemSx}>
          <div>
            <div>{camera.label}</div>
            <div style={{opacity: 0.72, fontSize: '0.68rem', marginTop: 2}}>{camera.description}</div>
          </div>
        </MenuItem>
      ))}
    </Select>
  )
}