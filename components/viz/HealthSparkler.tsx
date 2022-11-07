import Tooltip from '@mui/material/Tooltip'
import {color} from './Timeline'



const padding = {padding: '5px 0 0 10px'}
const cellWidth = 3
const cellHeight = 15
const cellPad = 1


export function healthColor(val, obj) {
  if (val == null)
    return color.noValue
  return val == 0 ? color.red4 : color.green
}


export function sanityColor(val, obj) {
  if (val == null)
    return color.noValue
  return val == 0 ? color.green : color.red4
}



type Props = {
  data: {value: number}[]
  colorFunc: (value: number, obj?: object) => string
  name: string | JSX.Element
  width?: number
  height?: number
  cellW?: number
  cellPad?: number
  ttPlacement?: 'top' | 'right' | 'left' | 'bottom'
}

export default function HealthSparkler(props: Props) {
  const {data, colorFunc, name, ttPlacement} = props

  if (!data) return <></>

  let height = props.height || cellHeight
  let cellW = props.cellW || cellWidth
  let pad = props.cellPad ?? cellPad

  return (
    <Tooltip title={name} placement={ttPlacement || 'right'}>
      <svg width={data.length * (cellW + pad) + cellW + 10} height={height} style={padding}>
        {data.map((o, j) =>
          <rect
            x={j * (cellW + pad)}
            width={cellW}
            height={cellHeight}
            fill={colorFunc(o.value, o)}
            key={j}
          />
        )}
      </svg>
    </Tooltip>
  )
}

