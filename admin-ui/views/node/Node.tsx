import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useParams } from 'react-router-dom'

import TextField from '@material-ui/core/TextField'
import Alert from '@material-ui/lab/Alert'

import * as BH from '../../apis/beehive'
import * as BK from '../../apis/beekeeper'
import { useProgress } from '../../../components/progress/ProgressProvider'


const colorMap = {
  noValue: '#f2f2f2',
  green1: '#b2dfb0',
  green2: '#8ed88b',
  green3: '#4cc948',
  green4: '#06af00',
  red1: '#ffc5c5',
  red2: '#ff8686',
  red3: '#d34848',
  red4: '#890000',
  orange1: '#d49318'
}


const tooltip = (item) =>
  <div>
    {new Date(item.timestamp).toLocaleTimeString()}<br/>
    {item.value == 0 ? 'passed' : (item.meta.severity == 'warning' ? 'warning' : 'failed')}
  </div>


function DefaultTooltip(props) {
  const {date, value} = props

  return (
    <>
      {new Date(date).toDateString().slice(0, 10)}<br/>
       value: {value}
    </>
  )
}

function Tooltip(props) {
  const {show, offset, tooltip} = props
  let {x = 0, y = 0, date, name, value, item} = props.data

  return (
    <TooltipRoot
      style={{
        top: y - offset * 2 - tooltipPad * 2,
        left: x + offset
      }}
      className={`${show && 'show '} tooltip` }
    >
      {show &&
        <>
          {tooltip ?
            <div key={`${date}-${name}`}>{tooltip(item)}</div> :
            <DefaultTooltip date={date} value={value} />
          }
        </>
      }
    </TooltipRoot>
  )
}

const tooltipPad = 8
const TooltipRoot = styled.div`
  position: absolute;
  background: #666;
  color: #fff;
  padding: ${tooltipPad}px;
  opacity: 0;
  transition: opacity .5s;
  font-size: 0.9em;
  z-index: 9999;
  white-space: nowrap;

  &.show {
    opacity: 1.0;
    transition: all .5s;
    transition-property: opacity, top, left;
  }

  &:empty {
    visibility: hidden;
  }
`


const xStart = 200
const yStart = 70
const fontSize = 12
const cellPad = 4
const w = 10
const h = fontSize
const hoverStroke = '#666'
const showGrid = false


export const Chart = React.memo((props) => {
  const {
    data,
    colorForValue,
    bins,
    onMouseOver,
    onMouseOut
  } = props

  const names = Object.keys(data)

  const cells = []
  for (let i = 0; i < names.length; i++) {
    const name = names[i]
    const row = data[name]

    for (let j = 0; j < bins.length; j++) {
      const l = bins[j]
      const u = bins[j + 1]

      const x = xStart + j * (w + cellPad)
      const y = yStart + i * (h + cellPad) - h

      const matches = row.filter(item => {
        const timestamp = item.timestamp
        const d = new Date(timestamp)
        return l <= d && d <= u
      })

      if (!matches.length) {
        cells.push(
          <rect
            key={`empty-${i}-${j}`}
            x={x}
            y={y}
            width={fontSize}
            height={fontSize}
            fill={colorMap.noValue}
            onMouseOut={(evt) => onMouseOut(evt)}
            rx="3"
          />
        )
        continue
      }

      const item = matches[matches.length - 1]
      const value = item.value
      const timestamp = item.timestamp

      const hoverData = {x, y, item, value}
      cells.push(
        <rect
          key={timestamp}
          x={x}
          y={y}
          width={fontSize}
          height={fontSize}
          fill={colorForValue(value, item)}
          onMouseOver={() => onMouseOver(hoverData)}
          onMouseOut={(evt) => onMouseOut(evt)}
          rx="3"
        />
      )
    }
  }

  // xaxis elements
  const xAxis = []
  for (let j = 0; j < bins.length; j++) {
    if (j % 3)
      continue

    const date = bins[j]
    const x = xStart + j * (w + cellPad)
    const hour = date.toLocaleString('en-US', { hour: 'numeric', hour12: true })

    xAxis.push(
      <text
        x={x}
        y={yStart - 25}
        fontSize={fontSize / 1.3}
        key={`${date}-ordinal`}
        transform={`rotate(-40,${x + w / 2},${yStart-25})`}
      >
        {hour}
      </text>
    )
    xAxis.push(
      <line
        x1={x}
        y1={yStart - 20}
        x2={x}
        y2={yStart - h}
        strokeWidth={1}
        stroke="#aaa"
        key={date}
      />
    )

    // gridline option?
    if (showGrid) {
      xAxis.push(
        <line
          x1={x}
          y1={yStart}
          x2={x}
          y2={600}
          strokeWidth={1}
          stroke="#333"
          strokeDasharray="5,3"
          key={`timeaxis-line-${j}`}
        />
      )
    }
  }


  return (
    <>
      {/* y axis */}
      {names.map((name, i) => {
        const n = name.slice(name.lastIndexOf('.') + 1)

        return (
          <text
            key={n}
            x={xStart - cellPad}
            y={yStart + i * (fontSize + cellPad) - cellPad/2}
            fontSize={fontSize}
            textAnchor="end"
          >
            {n}
          </text>
        )
      })}

      {xAxis}

      {/* cells */}
      {cells}
    </>
  )
}, (prev, next) =>  true)

Chart.displayName = 'Heatmap > Chart'

const ChartRoot = styled.div`
  position: relative;
  overflow: scroll;

  .hover-box {
    position: absolute;
    fill: none;
  }
`



export function Heatmap(props) {
  const {data} = props

  const [hover, setHover] = useState(false)
  const [hoverInfo, setHoverInfo] = useState({})
  const items = Object.values(data)

  const canvasWidth = Math.max.apply(Math, items.map(a => a.length)) * (w + cellPad) + xStart + cellPad + 100


  const onMouseOver = (obj) => {
    setHover(true)
    setHoverInfo(obj)
  }

  const onMouseOut = (evt) => {
    const tgt = evt.relatedTarget
    if (tgt && tgt.classList.contains('hover-box'))
      return

    setHover(false)
  }

  return (
    <ChartRoot>
      <svg width={canvasWidth} height={650}>
        <Chart
          {...props}
          onMouseOver={onMouseOver}
          onMouseOut={onMouseOut}
        />

        {hover &&
          <>
            <rect className="hover-box"
              x={hoverInfo.x}
              y={hoverInfo.y}
              width={w + cellPad / 2}
              height={h + cellPad / 4}
              stroke={hoverStroke}
              strokeWidth={2}
              rx={3} />
          </>
        }
      </svg>


      <Tooltip
        data={hoverInfo}
        show={hover}
        offset={18}
        tooltip={tooltip}
      />
    </ChartRoot>
  )
}



export default function NodeView() {
  const {node} = useParams()

  const { setLoading } = useProgress()
  const [data, setData] = useState(null)
  const [chartData, setChartData] = useState<BH.AggMetrics>(null)
  const [bins, setBins] = useState<BH.AggMetrics>(null)
  const [error, setError] = useState(null)


  useEffect(() => {
    BK.fetchNode(node)
      .then(data => setData(data))
      .catch(error => setError(error))

    setLoading(true)
    BH.getSanityChart(node.toLowerCase())
      .then((data) => {
        const d = data[node.toLowerCase()][`${node.toLowerCase()}.ws-nxcore`]

        const bins = computeBins(d)

        setBins(bins)
        setChartData(d)
      }).finally(() => setLoading(false))

  }, [node, setLoading])


  if (!data && !error) return <></>


  return (
    <Root>
      <h1>{node}</h1>

      <h2 className="no-margin">Tests</h2>
      {chartData &&
        <Heatmap
          data={chartData}
          bins={bins}
          colorForValue={(val, obj) => {
            if (val == null)
              return colorMap.noValue

            if (val <= 0)
              return colorMap.green3
            else if (obj.meta.severity == 'warning')
              return colorMap.orange1
            else
              return colorMap.red4
          }}
        />
      }

      <h2>Node Details</h2>

      <table className="key-value-table">
        <tbody>
          <tr>
            <td>Status</td>
            <td className={data.status == 'active' ? 'success' : ''}>
              <b>{data.status}</b>
            </td>
          </tr>

          {Object.entries(data)
            .map(([key, val]) => {
              const label = key.replace(/_/g, ' ')
                .replace(/\b[a-z](?=[a-z]{1})/g, c => c.toUpperCase())
              return <tr key={key}><td>{label}</td><td>{val || '-'}</td></tr>
            })
          }

          {data.contact &&
            <>
              <tr><td colSpan={2}>Contact</td></tr>
              <tr>
                <td colSpan={2} style={{fontWeight: 400, paddingLeft: '30px'}}>{data.contact}</td>
              </tr>
            </>
          }
        </tbody>
      </table>

      <br/><br/>

      <TextField
        id={`sage-${data.name}-notes`}
        label="Notes"
        multiline
        rows={4}
        defaultValue={data.notes}
        variant="outlined"
        style={{width: '50%'}}
      />

      {error &&
        <Alert severity="error">{error.message}</Alert>
      }
    </Root>
  )
}


function computeBins(data: BH.AggMetrics) {
  const items = Object.values(data)

  const startValues = items.map(a => new Date(a[0].timestamp).getTime() )
  const endValues = items.map(a => new Date(a[a.length - 1].timestamp).getTime() )
  const start = Math.min(...startValues)
  const end = Math.max(...endValues)

  const bins = getHours(new Date(start), new Date(end))

  return bins
}


function getHours(startDate, endDate) {
  const dates = []
  let nextDate = new Date(startDate)
  nextDate.setHours(nextDate.getHours(), 0, 0, 0)
  while (nextDate <= endDate) {
    dates.push(nextDate)
    nextDate = new Date(nextDate)
    nextDate.setHours(nextDate.getHours() + 1, 0, 0, 0)
  }

  return dates
}



const Root = styled.div`
  margin: 20px;
`