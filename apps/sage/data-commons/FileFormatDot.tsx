import Dot from '/components/utils/Dot'

const typeColorMap = {
  default: 'rgb(28,140,201)',
  JSON: '#efdb50',
  ndjson: '#efdb50',
  PDF: '#ac3535',
  TAR: '#4e4e4e',
  running: '#de9300'
}

type FileFormatProps = {
  format: string
}

export function FileFormatDot(props: FileFormatProps) {
  const {format} = props

  const color = typeColorMap[format] || typeColorMap.default

  return (
    <div className="flex items-center">
      <Dot color={color} />
      <span className="muted">{format.toLowerCase()}</span>
    </div>
  )
}
