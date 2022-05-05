import { useLayoutEffect, useRef } from 'react'
import styled from 'styled-components'

import * as d3 from 'd3'
import Legend from './d3-color-legend'

import ArrowLeft from '@mui/icons-material/ArrowBackIosNew'
import ArrowRight from '@mui/icons-material/ArrowForwardIos'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import HomeIcon from '@mui/icons-material/HomeOutlined'

const defaultMargin = { top: 20, left: 150, right: 150, bottom: 50 }
const defaultWidth = 800
const hour = 60 * 60 * 1000

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
  blues: ['#eff3ff', '#c6dbef', '#9ecae1', '#6baed6', '#3182bd', '#08519c', '#053e78']
}

function parseData(data) {
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


function getDomain(data) {
  const sorted = [...data].sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp))
  const start = new Date(sorted[0].timestamp)
  const end =  new Date( new Date(sorted[sorted.length - 1].timestamp).getTime() + hour)
  return [start, end]
}

function getMinMax(data) {
  const sorted = [...data].sort((a, b) => a.value - b.value)
  return [sorted[0].value, sorted.pop().value]
}

function computeCanvasHeight(yLabels: string[], cellHeight: number) : number {
  return yLabels.length * cellHeight
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
    .range(redSpectrum)

  return colorScale
}


function showGuide(ref, svg, y) {
  const foo = d3.select(ref).node().getBBox()

  svg.append('rect')
    .attr('class', 'guide')
    .attr('x', 0 + guideStroke)
    .attr('y', foo.y + margin.top)
    .attr('width', width + margin.left)
    .attr('height', y.bandwidth() - 2 )
    .attr('stroke', '#0088ff')
    .attr('stroke-width', guideStroke)
    .attr('fill', 'none')
}




function drawChart(
  domEle: HTMLElement,
  params: TimelineProps & {
    width: number,
    yLabels: string[],
    size: {m: number, n: number},
  }
) {

  const {
    data,
    endTime,
    scaleExtent,
    margin,
    width = defaultWidth,
    tailHours,
    yLabels,
    yFormat,
    tooltip,
    colorCell,
    onCellClick,
    onRowClick
  } = params


  const [start, end] = getDomain(data)
  const height = computeCanvasHeight(yLabels, cellHeight)

  const zoom = d3.zoom()
    .filter((evt) => evt.type === 'wheel' ? evt.ctrlKey : true)
    .scaleExtent(scaleExtent || [.2, 30])
    .on('zoom', zoomed)

  // create scaling functions
  const x = d3.scaleTime()
    .domain([
      tailHours ? (new Date(end).getTime() - tailHours*60*60*1000) : start,
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
  if (yFormat) {
    yAxis.tickFormat(yFormat)
  }

  const svg = d3.select(domEle).append('svg')
    .attr('width', width + margin.left)
    .attr('height',  height + margin.top + margin.bottom)
    .attr('cursor', 'grab')

  const gX = svg.append('g')
    .attr('cursor', 'grab')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
    .call(xAxis)


  // add cells
  const cells = svg.append('g')
    .attr('width', width)
    .style('cursor', onCellClick ? 'pointer' : 'auto')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

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
    .attr('fill', (d) => {
      if (colorCell)
        return colorCell(d.value, d)
      else if (d.value > 0 && d.meta.severity == 'warning')
        return color.orange
      else
        return d.value == 0 ? color.green : colorScale(d.value)
    })
    .on('mouseenter', function(evt, data) {
      // showGuide(this, svg, y)
      d3.select(this)
        .attr('opacity', 0.85)
        .attr('stroke-width', 2)
        .attr('stroke', '#444')
      showTooltip(evt, data)
    })
    .on('mouseleave', function() {
      d3.select('.guide').remove()
      d3.select(this)
        .attr('opacity', 1.0)
        .attr('stroke', null)
      tt.style('display', 'none')
    })
    .on('click', (evt, data) => {
      if (!onCellClick) return
      onCellClick(data)
    })


  // add y axis (with overlay)
  svg.append('g')
    .append('rect')
    .attr('fill', '#fff')
    .attr('x', 0)
    .attr('y', margin.top)
    .attr('width', margin.left)
    .attr('height', height)

  svg.append('g')
    .attr('class', `y-axis`)
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
    .call(yAxis)
    .on('click', (evt) => {
      if (!onRowClick) return

      const label = d3.select(evt.target).data()[0]
      const row = data.filter(o => o.row == label)
      onRowClick(label, row)
    })

  /**
   * tooltip
   */
  const tt = d3.select(domEle)
    .selectAll('#tooltip')
    .data([null])
    .join('div')
    .attr('id', 'tooltip')
    .style('position', 'absolute')
    .style('display', 'none')
    .style('background', '#000')
    .style('color', '#fff')
    .style('padding', '1em')

  const showTooltip = (evt, data) => {
    tt.html(tooltip ? tooltip(data) :
      `${new Date(data.timestamp).toDateString()} ${new Date(data.timestamp).toLocaleTimeString()}<br>
       ${data.value == 0 ? 'passed' : (data.meta.severity == 'warning' ? 'warning' : 'failed')}<br>
       value: ${data.value}`
    )
      .style('top', `${evt.pageY + 15}px`)
      .style('left', `${evt.pageX - 80}px`)
      .style('z-index', 999)

    tt.style('display', null)
  }

  /**
   * panning/zooming
   **/
  svg.call(zoom)

  function zoomed(e) {
    const newScale = e.transform.rescaleX(x)

    cells.selectAll('.cell')
      .attr('x', (d) => newScale(new Date(d.timestamp)))
      .attr('width', (d) => computeWidth(d, newScale))

    gX.call(xAxis.scale(newScale))
  }

  function computeWidth(d, scale) {
    const x = scale

    let w = d.end ?
      x(new Date(d.end).getTime()) - x(new Date(d.timestamp)) :  // use end time
      x(new Date(d.timestamp).getTime() + hour) - x(new Date(d.timestamp)) // otherwise, assume hour (for now)

    return w > cellPad ? w - cellPad : cellPad
  }

  // add events for button controls
  const ctrls = d3.select(domEle).select(function() { return this.parentNode })
  ctrls.select('.pan-left').on('click', () => pan('left'))
  ctrls.select('.pan-right').on('click', () => pan('right'))
  ctrls.select('.zoom-in').on('click', () => zoomTo('in'))
  ctrls.select('.zoom-out').on('click', () => zoomTo('out'))
  ctrls.select('.reset').on('click', () => reset())

  function pan(dir) {
    const amount = dir == 'right' ? panAmount : -panAmount
    const t = d3.zoomTransform(svg.node())
    const transform = d3.zoomIdentity.translate(t.x - amount, t.y).scale(t.k)
    zoom.transform(svg.transition().duration(200).ease(d3.easeLinear), transform)
  }

  function zoomTo(dir) {
    const center = width / 2

    const zoomTransform = d3.zoomTransform(svg.node())

    let scale = zoomTransform.k,
        extent = zoom.scaleExtent(),
        x = zoomTransform.x,
        factor = dir == 'in' ? 1.5 : 1 / 1.5,
        targetScale = scale * factor;

    // Don't pass scaling extent in either direction
    if (targetScale < extent[0] || targetScale > extent[1]) {
        return false;
    }

    // If the factor is too much, scale it down to reach the extent exactly
    let clampedTargetScale = Math.max(extent[0], Math.min(extent[1], targetScale));

    if (clampedTargetScale != targetScale) {
        targetScale = clampedTargetScale;
        factor = targetScale / scale;
    }

    // Center each vector, stretch, then put back
    x = (x - center) * factor + center;

    const transform = d3.zoomIdentity.translate(x, zoomTransform.y).scale(targetScale)
    zoom.transform(svg.transition().duration(200).ease(d3.easeLinear), transform);
  }

  function reset() {
    svg.transition().duration(500).ease(d3.easeLinear).call(zoom.transform, d3.zoomIdentity);
  }
}



function appendLegend(ele, chartData) {
  const [_, max] = getMinMax(chartData) //todo(nc): optimze; only needs to be computed once

  const legend = Legend(
    d3.scaleOrdinal(
      ['pass', '1 issue', '≥10 issues', `${max} issues`], [color.green, ...redSpectrum]
    ), {
      title: 'Legend',
      tickSize: 0
    })

  d3.select(ele).node().append(legend)
}



type Record = {
  timestamp: string
  value: number
  end?: string
  meta?: object           // user provided meta is allowed
  [other: string]: any    // extra user provided key/values is allowed too
}

type Data = { [key: string]: Record[] }

type TimelineProps = {
  data: Data
  endTime?: Date
  scaleExtent?: [number, number]
  margin?: {top?: number, right?: number, bottom?: number, left?: number}
  tailHours?: number
  showLegend?: boolean
  showButtons?: boolean
  yFormat?: (label) => string
  onRowClick?: (label: string, items: Record[]) => void
  onCellClick?: (label: string) => void
  colorCell?: (val: number, item: Record) => string
  tooltip?: (item: Record) => string  // update to use React.FC?
}


function Chart(props: TimelineProps) {
  let {
    data,
    margin,
    showButtons = true,
    ...rest
  } = props

  // merge margins together
  margin = {...defaultMargin, ...props.margin}

  const ref = useRef(null)
  const legendRef = useRef(null)

  useLayoutEffect(() => {
    let node = ref.current

    let yLabels, chartData, size
    if (typeof data == 'object') {
      yLabels = Object.keys(data)
      chartData = parseData(data)
      size = computeSize(data)
    } else {
      throw `data format should be an object in form { [key: string]: {}[] }, was: ${data}`
    }

    const ro = new ResizeObserver(_debounce(100, entries => {
      const entry = entries[0]
      const cr = entry.contentRect
      const width = cr.width - margin.left - margin.right

      const svg = node.querySelector('svg')
      if (svg) {
        svg.remove()
      }

      drawChart(node, {
        data: chartData,
        width,
        yLabels,
        size,
        margin,
        ...rest
      })
    }))

    ro.observe(node)

    const legendNode = legendRef.current
    const legendSvg = legendNode.querySelector('svg')
    if (props.showLegend && !legendSvg) {
      appendLegend(legendNode, chartData)
    }

    return () => {
      ro.unobserve(node)
    }
  }, [data, rest, margin, props.showLegend])


  return (
    <div>
      <div ref={legendRef} style={{marginLeft: margin.left, marginBottom: '20px'}}></div>

      {showButtons &&
        <Ctrls style={{marginRight: margin.right}}> {/* note: controls are assumed to be a direct child node for events */}
          <button className="reset" title="reset zoom/panning"><HomeIcon /></button>
          <button className="pan-left" title="pan left"><ArrowLeft /></button>
          <button className="zoom-in" title="zoom in"><ZoomInIcon /></button>
          <button className="zoom-out" title="zoom out"><ZoomOutIcon /></button>
          <button className="pan-right" title="pan right"><ArrowRight /></button>
        </Ctrls>
      }

      <div ref={ref}></div>
    </div>
  )
}


// see https://jsfiddle.net/rudiedirkx/p0ckdcnv/
const _debounce = function(ms, fn) {
  var timer
  return function() {
    clearTimeout(timer)
    var args = Array.prototype.slice.call(arguments)
    args.unshift(this)
    timer = setTimeout(fn.bind.apply(fn, args), ms)
  }
}



export default function TimelineContainer(props: TimelineProps) {
  return (
    <Root colorLinks={!!props.onRowClick}>
      <Chart {...props} />
    </Root>
  )
}

const Root = styled.div<{colorLinks: boolean}>`
  ${props => props.colorLinks && `
    .y-axis text {
        color: #0080c7;
        font-size: 1.2em;
      }
      .y-axis text:hover {
        cursor: pointer;
        text-decoration: underline;
      }
    }`
  }
`

const Ctrls = styled.div`
  display: flex;
  justify-content: end;
  margin: 0 20px 15px 15px;

  button {
    margin: 0 2px;
    background: none;
    border-radius: 3px;
    cursor: pointer;
    border: 1px solid rgba(0, 0, 0, .2);

    :hover {
      border: 1px solid #1d7198;
      .MuiSvgIcon-root {
        color: #1d7198;
      }
    }

    .MuiSvgIcon-root {
      font-size: 1.25rem;
      padding-top: 2px;
    }
  }

  .reset {
    margin-right: 15px;
  }
`

