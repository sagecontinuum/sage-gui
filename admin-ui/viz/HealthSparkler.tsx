import React from 'react'

import Tooltip from '@mui/material/Tooltip'

import {colors} from './TimelineChart'


const padding = {padding: '5px 0 0 10px'}
const canvasWidth = 50
const canvasHeight = 15
const cellWidth = 3
const cellHeight = 10
const cellPad = 1


export function healthColor(val, obj) {
  if (val == null)
    return colors.noValue
  return val == 0 ? colors.red4 : colors.green
}


export function sanityColor(val, obj) {
  if (val == null)
    return colors.noValue
  return val == 0 ? colors.green : colors.red4
}



type Props = {
  data: {value: number}[]
  colorFunc: (value: number, obj?: object) => string
  name: string
  width?: number
  height?: number
  cellW?: number
  ttPlacement?: 'top' | 'right' | 'left' | 'bottom'
}

export default function HealthSparkler(props: Props) {
  const {data, colorFunc, name, ttPlacement} = props

  if (!data) return <></>

  let width = props.width || canvasWidth
  let height = props.height || canvasHeight
  let cellW = props.cellW || cellWidth


  return (
    <Tooltip title={name} placement={ttPlacement || 'right'}>
      <svg width={width} height={height} style={padding}>
        {data.map((o, j) =>
          <rect
            x={j * (cellW + cellPad)}
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

