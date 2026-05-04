
import { ListSubheader, MenuItem, Select } from '@mui/material'
import { compactHeaderSx, compactMenuItemSx, compactSelectSx } from './selectStyles'

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

export const cameraOptions: CameraOption[] = [{
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
      <ListSubheader sx={compactHeaderSx}>
        camera source
      </ListSubheader>
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