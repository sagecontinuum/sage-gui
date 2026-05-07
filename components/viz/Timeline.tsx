// @ts-nocheck
import { useEffect, useRef, useState, memo } from 'react'
import styled from 'styled-components'

import * as d3 from 'd3'
// todo(nc): import Legend from './d3-color-legend'

import TimelineLabels from './TimelineLabels'

import ArrowLeft from '@mui/icons-material/ArrowBackIosNew'
import ArrowRight from '@mui/icons-material/ArrowForwardIos'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import HomeIcon from '@mui/icons-material/HomeOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMoreRounded'
import ExpandLessIcon from '@mui/icons-material/ExpandLessRounded'

import TimelineContainer from './TimelineContainer'
export { TimelineContainer }


const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

const CELL_UNITS = {
  'hour': HOUR,
  'day': DAY
}

const margin = { top: 20, left: 2, right: 10, bottom: 50 }
const defaultWidth = 800

const cellHeight = 15
const cellPad = 2
const borderRadius = 0
const guideStroke = 3

const panAmount = 100

const redSpectrum = [
  '#ff8686',
  '#890000',
  '#520000'
]

export const color = {
  noValue: '#efefef',
  green: '#4cc948',
  green1: '#b2dfb0',
  green2: '#8ed88b',
  green3: '#4cc948',
  green4: '#06af00',
  red1: '#ffc5c5',
  red2: '#ff8686',
  red3: '#d34848',
  red4: '#890000',
  orange: '#d49318',
}

export const colors = {
  blues: ['#eff3ff', '#c6dbef', '#9ecae1', '#6baed6', '#3182bd', '#08519c', '#053e78'],
  noValue: '#dcdcdc'
}

function parseData(data: Data) : Record[] {
  let array = []
  Object.keys(data).map((key) => {
    const rows = data[key].map(obj => ({
      row: key,
      ...obj
    }))

    array = [...array, ...rows]
  })
  return array
}


function getDomain(data, cellUnit) {
  const sorted = [...data].sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp))
  const start = new Date(sorted[0].timestamp)
  const end =  new Date( new Date(sorted[sorted.length - 1].timestamp).getTime() + cellUnit)
  return [start, end]
}

function getMinMax(data) {
  const sorted = [...data].sort((a, b) => a.value - b.value)
  return [sorted[0].value, sorted.pop().value]
}

function computeCanvasHeight(m: number, cellHeight: number) : number {
  return m * cellHeight
}

function computeSize(data: Data) : {m: number, n: number} {
  const lengths = Object.values(data).map(arr => arr.length)
  return {
    m: Object.keys(data).length,
    n: Math.max(...lengths)
  }
}


export function getColorScale(data) {
  const [min, max] = getMinMax(data)

  const colorScale = d3.scaleLinear()
    .domain([min, 10, max])
    // @ts-ignore: ???
    .range(redSpectrum)

  return colorScale
}


// eslint-disable-next-line @typescript-eslint/no-unused-vars
function showGuide(ref, svg, y) {
  const foo = d3.select(ref).node().getBBox()

  svg.append('rect')
    .attr('class', 'guide')
    .attr('x', 0 + guideStroke)
    .attr('y', foo.y + margin.top)
    .attr('width', margin.left)
    .attr('height', y.bandwidth() - 2 )
    .attr('stroke', '#0088ff')
    .attr('stroke-width', guideStroke)
    .attr('fill', 'none')
}

function drawRect(ctx, x: number, y: number, w: number, h: number, color) {
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.fillStyle = color
  ctx.fill()
  ctx.closePath()
}

const getFill = (d, colorCell, colorScale) => {
  if (colorCell)
    return colorCell(d.value, d)
  else if (d.value > 0 && d.meta.severity == 'warning')
    return color.orange
  else
    return d.value == 0 ? color.green : colorScale(d.value)
}



function renderCanvasCells(args) {
  const {
    domEle,
    data,
    width,
    height,
    x, y,
    computeWidth,
    colorCell,
    colorScale
  } = args

  const pixelRatio = window.devicePixelRatio

  // Add the canvas
  const canvasHeight = height + margin.top
  const context = d3.select(domEle)
    .append('div')
    .style('position', 'absolute')
    .style('top', 0)
    .style('left', 0)
    .append('canvas')
    .attr('width', width * pixelRatio)
    .attr('height', canvasHeight * pixelRatio)
    .style('width', `${width}px`)
    .style('height', `${canvasHeight}px`)
    .style('border', '1px solid black')
    .node().getContext('2d')

  context.scale(pixelRatio, pixelRatio)


  data.forEach(function(d) {
    drawRect(context,
      x(new Date(d.timestamp)),
      y(d.row) + cellPad,
      computeWidth(d, x),
      Math.max(y.bandwidth() - cellPad, 1),
      getFill(d, colorCell, colorScale)
    )
  })

  return context
}


function renderSVGCells(args) {
  const {
    svg,
    domEle,
    data,
    width,
    x, y,
    computeWidth,
    onCellClick,
    colorCell,
    tooltip,
    rowHeight,
    // tooltipPos,
    colorScale
  } = args

  // add cell container
  const cells = svg.append('g')
    .attr('width', width)
    .style('cursor', onCellClick ? 'pointer' : 'auto')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  // add cells
  cells.selectAll()
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'cell')
    .attr('x', (d) => x(new Date(d.timestamp)) )
    .attr('y', (d) => y(d.row) + cellPad)
    .attr('width', (d) => computeWidth(d, x))
    .attr('height', y.bandwidth() - 2 )
    .attr('rx', borderRadius)
    .attr('stroke-width', 2)
    // .attr('opacity', .5)
    .attr('fill', (d) => getFill(d, colorCell, colorScale))
    .on('click', (evt, data) => {
      if (!onCellClick) return
      onCellClick(data, evt)
    })

  /**
   * tooltip
   */
  d3.select(domEle)  // ensure SVG children stack above fixed tooltip
    .style('position', 'relative')

  const tt = d3.select(domEle)
    .selectAll('#tooltip')
    .data([null])
    .join('div')
    .attr('id', 'tooltip')
    .style('position', 'fixed')
    .style('display', 'none')
    .style('pointer-events', 'none')
    .style('background', '#000')
    .style('color', '#fff')
    .style('padding', '1em')

  // cellClientCx: horizontal center of the cell in viewport (clientX) space
  // cellClientTopY: top edge of the cell in viewport (clientY) space
  const showTooltip = (cellClientCx: number, cellClientTopY: number, data) => {
    tt.html(tooltip ? tooltip(data) :
      `${new Date(data.timestamp).toDateString()} ` +
      `${new Date(data.timestamp).toLocaleTimeString()}<br>
       ${data.value == 0 ? 'passed' : (data.meta.severity == 'warning' ? 'warning' : 'failed')}<br>
       value: ${data.value}`
    )
      .style('display', null)
      .style('z-index', 99999)

    // position fixed against the viewport, clamped to stay on screen
    const ttNode = tt.node() as HTMLElement
    const ttWidth = ttNode.offsetWidth
    const ttHeight = ttNode.offsetHeight
    const vw = window.innerWidth
    const vh = window.innerHeight

    // prefer above the cell; flip below if not enough room
    let top = cellClientTopY >= ttHeight + 10
      ? cellClientTopY - ttHeight - 6
      : cellClientTopY + (rowHeight - 2 * cellPad) + 6

    // clamp to viewport
    top = Math.max(0, Math.min(top, vh - ttHeight))
    const left = Math.max(0, Math.min(cellClientCx - ttWidth / 2, vw - ttWidth))

    tt.style('top', `${top}px`)
      .style('left', `${left}px`)
  }

  return { cells, tt, showTooltip }
}



function drawChart(
  domEle: HTMLElement,
  params: TimelineProps & {
    width: number,
    yLabels: string[],
    size: {m: number, n: number}
  }
) {

  const {
    data,
    startTime,
    endTime,
    scaleExtent,
    width = defaultWidth,
    yLabels,
    yFormat,
    tooltip,
    tooltipPos = 'bottom',
    useD3YAxis,
    colorCell,
    touchIntervals,
    cellHeightPx,
    tooltipAnchorVisibleCenter = true,
    onCellClick,
    onRowClick
  } = params


  const cellUnit = params.cellUnit ? CELL_UNITS[params.cellUnit] : CELL_UNITS.hour
  const rowHeight = cellHeightPx || cellHeight

  const [start, end] = getDomain(data, cellUnit)
  const height = computeCanvasHeight(yLabels.length, rowHeight)

  const zoom = d3.zoom()
    .filter((evt) => evt.type === 'wheel' ? evt.ctrlKey : true)
    .scaleExtent(scaleExtent || [.2, 30])
    .on('zoom', zoomed)

  // create scaling functions
  const x = d3.scaleTime()
    .domain([
      startTime || start,
      endTime || end
    ])
    .range([0, width])


  const y = d3.scaleBand()
    .domain(yLabels)
    .range([0, height])

  const colorScale = getColorScale(data)

  // create axises
  const xAxis = d3.axisTop(x)
  const yAxis = d3.axisLeft(y)

  // format y axis labels if needed
  if (yFormat && useD3YAxis) {
    yAxis.tickFormat(yFormat as (label: string) => string)
  }

  const svgHeight = height + margin.top
  const svg = d3.select(domEle).append('svg')
    .attr('width', '100%')
    .attr('height', svgHeight)
    .attr('cursor', 'grab')


  const gX = svg.append('g')
    .attr('cursor', 'grab')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
    .call(xAxis)

  const useCanvas = false
  let cells, context, tt, showTooltip
  if (useCanvas) {
    context = renderCanvasCells({
      svg, domEle, data, x, y, width, height, tooltip, tooltipPos,
      computeWidth, onCellClick, colorCell, colorScale
    })
  } else {
    const svgResult = renderSVGCells({
      svg, domEle, data, x, y, width, tooltip, tooltipPos, rowHeight,
      computeWidth, onCellClick, colorCell, colorScale
    })
    cells = svgResult.cells
    tt = svgResult.tt
    showTooltip = svgResult.showTooltip
  }

  // track current x scale (updated on zoom) and nearest-cell hover state
  let currentX = x
  let hoveredDatum = null

  if (!useCanvas) {
    svg.on('mousemove', (evt) => {
      const [mx, my] = d3.pointer(evt)

      // only activate within the cells area
      if (my < margin.top || my > margin.top + height) {
        if (hoveredDatum) {
          cells.selectAll('.cell').filter(d => d === hoveredDatum)
            .attr('opacity', 1.0).attr('stroke', null)
          hoveredDatum = null
        }
        tt.style('display', 'none')
        return
      }

      const relX = mx - margin.left
      const relY = my - margin.top

      // snap to nearest row by y midpoint
      let closestRow = null
      let minRowDist = Infinity
      yLabels.forEach(rowKey => {
        const dist = Math.abs(relY - (y(rowKey) + y.bandwidth() / 2))
        if (dist < minRowDist) { minRowDist = dist; closestRow = rowKey }
      })

      // find nearest cell in that row by x center
      let closestDatum = null
      let minXDist = Infinity
      let closestRenderOrder = -1
      data.filter(d => d.row === closestRow).forEach((d, renderOrder) => {
        const cellX = currentX(new Date(d.timestamp))
        const cellW = computeWidth(d, currentX)
        const cellRight = cellX + cellW
        // Distance to the cell interval: 0 when cursor is inside the cell.
        const dist = relX < cellX ? cellX - relX : (relX > cellRight ? relX - cellRight : 0)
        if (dist < minXDist || (dist === minXDist && renderOrder > closestRenderOrder)) {
          minXDist = dist
          closestDatum = d
          closestRenderOrder = renderOrder
        }
      })

      if (closestDatum !== hoveredDatum) {
        if (hoveredDatum) {
          cells.selectAll('.cell').filter(d => d === hoveredDatum)
            .attr('opacity', 1.0).attr('stroke', null)
        }
        if (closestDatum) {
          cells.selectAll('.cell').filter(d => d === closestDatum)
            .attr('opacity', 0.85).attr('stroke-width', 2).attr('stroke', '#444')
        }
        hoveredDatum = closestDatum
      }

      if (closestDatum) {
        // compute the cell's screen coordinates from the SVG bounding rect
        const svgRect = (svg.node() as SVGSVGElement).getBoundingClientRect()
        const cellSvgLeft = margin.left + currentX(new Date(closestDatum.timestamp))
        const cellWidth = computeWidth(closestDatum, currentX)
        const cellSvgRight = cellSvgLeft + cellWidth
        const plotLeft = margin.left
        const plotRight = margin.left + width

        const anchorSvgX = tooltipAnchorVisibleCenter
          ? (() => {
            const visibleLeft = Math.max(cellSvgLeft, plotLeft)
            const visibleRight = Math.min(cellSvgRight, plotRight)

            if (visibleRight > visibleLeft)
              return (visibleLeft + visibleRight) / 2

            // If the cell is entirely outside the viewport, clamp to chart edge.
            return Math.max(plotLeft, Math.min((cellSvgLeft + cellSvgRight) / 2, plotRight))
          })()
          : (cellSvgLeft + cellSvgRight) / 2

        const cellSvgTopY = margin.top + y(closestDatum.row) + cellPad
        const cellClientCx = svgRect.left + anchorSvgX
        const cellClientTopY = svgRect.top + cellSvgTopY
        showTooltip(cellClientCx, cellClientTopY, closestDatum)
      }
    })

    svg.on('mouseleave', () => {
      if (hoveredDatum) {
        cells.selectAll('.cell').filter(d => d === hoveredDatum)
          .attr('opacity', 1.0).attr('stroke', null)
        hoveredDatum = null
      }
      tt.style('display', 'none')
    })
  }

  // add y axis overlay
  svg.append('g')
    .append('rect')
    .attr('fill', '#fff')
    .attr('x', 0)
    .attr('y', margin.top)
    .attr('width', margin.left)
    .attr('height', height)

  // optionally render y axis with d3
  if (useD3YAxis) {
    svg.append('g')
      .attr('class', `y-axis`)
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .call(yAxis)
      .on('click', (evt) => {
        if (!onRowClick) return

        const label = d3.select(evt.target).data()[0] as string
        const row = data.filter(o => o.row == label)
        onRowClick(label, row)
      })
  }


  /**
   * panning/zooming
   **/
  svg.call(zoom)

  function zoomed(e) {
    const newScale = e.transform.rescaleX(x)
    currentX = newScale

    if (useCanvas) {
      context.clearRect(0, 0, width, height)
      data.forEach(function(d) {
        drawRect(
          context,
          newScale(new Date(d.timestamp)),
          y(d.row) + cellPad,
          computeWidth(d, newScale),
          Math.max(y.bandwidth() - cellPad, 1),
          getFill(d, colorCell, colorScale)
        )
      })
    } else {
      cells.selectAll('.cell')
        .attr('x', (d) => newScale(new Date(d.timestamp)))
        .attr('width', (d) => computeWidth(d, newScale))
    }

    gX.call(xAxis.scale(newScale))
  }

  function computeWidth(d, scale) {
    const x = scale

    // use end time if provided, cellUnit is an hour unless user provided
    const w = d.end ?
      x(new Date(d.end).getTime()) - x(new Date(d.timestamp)) :
      x(new Date(d.timestamp).getTime() + cellUnit) - x(new Date(d.timestamp))

    if (touchIntervals)
      return Math.max(w, 0)

    return w > cellPad ? w - cellPad : cellPad
  }

  // add events for button controls
  const ctrls = d3.select(domEle).select(function() {
    return this.parentNode.parentNode
  })
  ctrls.select('.pan-left').on('click', (evt) => { evt.preventDefault(); pan('left') })
  ctrls.select('.pan-right').on('click', (evt) => { evt.preventDefault(); pan('right') })
  ctrls.select('.zoom-in').on('click', (evt) => { evt.preventDefault(); zoomTo('in') } )
  ctrls.select('.zoom-out').on('click', (evt) => { evt.preventDefault(); zoomTo('out') })
  ctrls.select('.reset').on('click', (evt) => { evt.preventDefault(); reset() })

  function pan(dir) {
    const amount = dir == 'right' ? panAmount : -panAmount
    const t = d3.zoomTransform(svg.node())
    const transform = d3.zoomIdentity.translate(t.x - amount, t.y).scale(t.k)
    zoom.transform(svg.transition().duration(200).ease(d3.easeLinear), transform)
  }

  function zoomTo(dir) {
    const center = width / 2

    const zoomTransform = d3.zoomTransform(svg.node())

    const scale = zoomTransform.k,
      extent = zoom.scaleExtent()

    let x = zoomTransform.x,
      factor = dir == 'in' ? 1.5 : 1 / 1.5,
      targetScale = scale * factor

    // Don't pass scaling extent in either direction
    if (targetScale < extent[0] || targetScale > extent[1]) {
      return false
    }

    // If the factor is too much, scale it down to reach the extent exactly
    const clampedTargetScale = Math.max(extent[0], Math.min(extent[1], targetScale))

    if (clampedTargetScale != targetScale) {
      targetScale = clampedTargetScale
      factor = targetScale / scale
    }

    // Center each vector, stretch, then put back
    x = (x - center) * factor + center

    const transform = d3.zoomIdentity.translate(x, zoomTransform.y).scale(targetScale)
    zoom.transform(svg.transition().duration(200).ease(d3.easeLinear), transform)
  }

  function reset() {
    svg.transition().duration(500).ease(d3.easeLinear).call(zoom.transform, d3.zoomIdentity)
  }
}


/* // todo(nc): generic legend
function appendLegend(ele, chartData) {
  const [_, max] = getMinMax(chartData)

  const legend = Legend(
    d3.scaleOrdinal(
      ['pass', '1 issue', '≥10 issues', `${max} issues`], [color.green, ...redSpectrum]
    ), {
      title: 'Legend',
      tickSize: 0
    })

  d3.select(ele).node().append(legend)
}
*/



type Record = {
  timestamp: string
  value: string | number
  name: string
  end?: string
  meta?: { // user provided meta is allowed
    [key: string]: string | number
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [other: string]: any
}

type Data = { [key: string]: Record[] }

export type TimelineProps = {
  data: Data
  startTime?: Date
  endTime?: Date
  cellHeightPx?: number
  scaleExtent?: [number, number]
  labelWidth?: number
  showLegend?: boolean
  showButtons?: boolean
  limitRowCount?: number
  cellUnit?: 'hour' | 'day'
  yFormat?: (label: string) => string | JSX.Element
  useD3YAxis?: boolean
  onRowClick?: (label: string, items: Record[]) => void
  onCellClick?: (item: Record, evt?: MouseEvent) => void
  colorCell?: (val: number, item: Record) => string
  touchIntervals?: boolean
  tooltipAnchorVisibleCenter?: boolean
  tooltip?: (item: Record) => string  // update to use React.FC?
  tooltipPos?: 'top' | 'bottom'       // todo(nc): there is surely a better general
                                      // solution for tooltip placement as well
}


function Chart(props: TimelineProps) {
  const {
    data,
    cellHeightPx,
    labelWidth,
    showLegend,
    showButtons = true,
    limitRowCount,
    useD3YAxis = false,
    ...rest
  } = props

  const rowHeight = cellHeightPx || cellHeight

  const [showAllRows, setShowAllRows] = useState(false)
  const [totalRows, setTotalRows] = useState(0)
  const [labels, setLabels] = useState(null)

  const ref = useRef(null)
  // const legendRef = useRef(null)

  useEffect(() => {
    const node = ref.current

    let yLabels, chartData, size
    if (typeof data == 'object') {
      // todo(nc): optimize by removing grouped api requirement.  allow flat array of objs?
      yLabels = Object.keys(data)
      chartData = parseData(data)
      size = computeSize(data)

      // ignore data with no rows for now
      if (size.m == 0)
        return
    } else {
      throw `data format should be an object in form { [key: string]: {}[] }, was: ${data}`
    }

    const ro = new ResizeObserver(entries => {
      const entry = entries[0]
      const cr = entry.contentRect
      const width = cr.width - margin.left - margin.right

      const svg = node.querySelector('svg')
      if (svg) {
        svg.remove()
      }

      // todo(nc): redraw, instead entirely replacing the canvas
      const canvas = node.querySelector('canvas')
      if (canvas) {
        canvas.remove()
      }

      if (limitRowCount) {
        setTotalRows(yLabels.length)
        yLabels = (limitRowCount && !showAllRows) ? yLabels.slice(0, limitRowCount) : yLabels
        chartData = chartData.filter(o => yLabels.includes(o.row) )
      }


      if (JSON.stringify(labels) !== JSON.stringify(yLabels) )
        setLabels(yLabels)

      drawChart(node, {
        data: chartData,
        yLabels,
        width,
        size,
        cellHeightPx,
        labelWidth,
        useD3YAxis,
        ...rest
      })
    })

    ro.observe(node)

    /* todo: legend
    const legendNode = legendRef.current
    const legendSvg = legendNode.querySelector('svg')
    if (showLegend && !legendSvg) {
      appendLegend(legendNode, chartData)
    }
    */

    return () => {
      ro.unobserve(node)
    }
  }, [data, rest, margin, showLegend, limitRowCount])


  return (
    <div>
      {/* legend; todo finish implementing? */}
      {/* <div ref={legendRef} style={{marginLeft: margin.left, marginBottom: '20px'}}></div> */}

      {/* controls */}
      {showButtons &&
        <Ctrls style={{marginRight: margin.right}}>
          {/* note: controls are assumed to be a direct child node for events */}
          <button className="btn reset" title="reset zoom/panning"><HomeIcon /></button>
          <button className="btn pan-left" title="pan left"><ArrowLeft /></button>
          <button className="btn zoom-in" title="zoom in"><ZoomInIcon /></button>
          <button className="btn zoom-out" title="zoom out"><ZoomOutIcon /></button>
          <button className="btn pan-right" title="pan right"><ArrowRight /></button>
        </Ctrls>
      }

      <div className="flex w-full">
        {/* y axis labels */}
        {labels &&
          <div style={{marginTop: margin.top, width: labelWidth}}>
            <TimelineLabels
              labels={labels}
              data={data}
              formatter={props.yFormat}
              margin={margin}
              rowHeightPx={rowHeight}
            />
          </div>
        }

        {/* d3.js timeline chart */}
        {/* note: for canvas we'll need `position: 'relative'` */}
        <div ref={ref} className="w-full"></div>
      </div>


      {/* collapse chart if limitRowCount is provided */}
      {limitRowCount && totalRows > limitRowCount &&
        <button
          onClick={() => setShowAllRows(prev => !prev)}
          className="more-btn"
          style={{marginLeft: margin.left}}
        >
          {showAllRows ?
            <>hide rows <ExpandLessIcon /></> :
            <>show {totalRows - limitRowCount} more rows <ExpandMoreIcon /></>
          }
        </button>
      }
    </div>
  )
}


export default memo(function TimelineContainer(props: TimelineProps) {
  return (
    <Root colorLinks={!!props.onRowClick}>
      <Chart {...props} />
    </Root>
  )
}, (prev, next) =>
  prev.data === next.data &&
  prev.colorCell === next.colorCell &&
  prev.onRowClick === next.onRowClick &&
  prev.onCellClick === next.onCellClick
)

const Root = styled.div<{colorLinks: boolean}>`
  width: 100%;
  --timeline-btn-border: rgba(128, 128, 128, 0.48);
  --timeline-btn-bg: transparent;
  --timeline-btn-hover-border: currentColor;
  --timeline-btn-hover-fg: inherit;
  --timeline-btn-shadow: none;
  --timeline-btn-hover-shadow: 0 0 0 1px currentColor;
  --timeline-btn-focus: rgba(128, 128, 128, 0.45);

  [data-mui-color-scheme='dark'] & {
    --timeline-btn-border: rgba(255, 255, 255, 0.48);
    --timeline-btn-fg: rgba(255, 255, 255, 0.56);
    --timeline-btn-bg: transparent;
    --timeline-btn-hover-border: rgba(255, 255, 255, 0.9);
    --timeline-btn-hover-fg: rgba(255, 255, 255, 0.72);
    --timeline-btn-shadow: none;
    --timeline-btn-hover-shadow: 0 0 0 1px currentColor;
    --timeline-btn-focus: rgba(255, 255, 255, 0.45);
  }

  .timeline {
    display: flex;
  }

  button {
    margin: 0 2px;
    background: var(--timeline-btn-bg);
    border-radius: 3px;
    cursor: pointer;
    border: 1px solid var(--timeline-btn-border);
    color: var(--timeline-btn-fg);

    .MuiSvgIcon-root {
      font-size: 1.25rem;
      padding-top: 2px;
      color: inherit;
    }

    :hover {
      border: 1px solid var(--timeline-btn-hover-border);
      color: var(--timeline-btn-hover-fg);

      .MuiSvgIcon-root {
        color: var(--timeline-btn-hover-fg);
      }
    }

    :focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px var(--timeline-btn-focus), var(--timeline-btn-hover-shadow);
    }
  }

  button.more-btn {
    display: flex;
    align-items: center;
  }

  ${props => props.colorLinks && `
    .y-axis text {
        color: #444;
        font-size: 1.2em;
        font-weight: 600;
      }
      .y-axis text:hover {
        cursor: pointer;
        text-decoration: underline;
      }
    }`}
`

const Ctrls = styled.div`
  float: right;
  margin: 0 20px 15px 15px;

  .reset {
    margin-right: 15px;
  }
`

