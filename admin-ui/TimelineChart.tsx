import React, { useLayoutEffect, useRef } from 'react'
import styled from 'styled-components'

import d3 from './d3'

const margin = { top: 50, left: 150, right: 40, bottom: 50 }
// const height = 700
const width = 800
const hour = 60 * 60 * 1000

const cellHeight = 15
const guideStroke = 3




const redShades = [
  '#d34848',
  '#520000'
]

export const colors = {
  noValue: '#efefef',
  green: '#06af00',
  orange: '#d49318',
  red1: redShades[0],
  red2: redShades[1]
}


function parseData(data) {
  let array = []
  Object.keys(data).map((key) => {
    const rows = data[key].map(obj => ({
      row: key,
      timestamp: obj.timestamp,
      meta: obj.meta,
      value: obj.value
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


function getWidthHeight(data, cellHeight) {
  const rowCount = new Set(data.map(o => o.row)).size

  return [NaN, rowCount * cellHeight]
}


export function getColorScale(data) {
  const [min, max] = getMinMax(data)

  const colorScale = d3.scaleLinear()
    .domain([min, max])
    .range(redShades)

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




function initChart(
  domEle: HTMLElement,
  params: {
    yLabels: string[],
  } & TimelineProps
) {

  const {
    yLabels,
    data,
    yFormat,
    tooltip,
    colorCell,
    onCellClick,
    onRowClick
  } = params

  const [start, end] = getDomain(data)
  const [_, height] = getWidthHeight(data, cellHeight)

  const zoom = d3.zoom()
    .scaleExtent([.2, 8])
    .on('zoom', zoomed)

  // create scaling functions
  const x = d3.scaleTime()
    .domain([start, end])
    .range([0, width])

  const y = d3.scaleBand()
    .domain(yLabels)
    .range([0, height])

  const colorScale = getColorScale(data)

  // create axises
  const timeAxis = d3.axisTop(x)
  const labelAxis = d3.axisLeft(y)


  // format y axis labels if needed
  if (yFormat) {
    labelAxis.tickFormat(yFormat)
  }

  const svg = d3.select(domEle).append('svg')
    .attr('width', width + margin.left)
    .attr('height',  height + margin.top + margin.bottom)

  const gX = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
    .call(timeAxis)


  // add cells
  const cells = svg.append('g')
    .attr('width', width)
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  cells.selectAll()
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'cell')
    .attr('x', (d) => x(new Date(d.timestamp)) )
    .attr('y', (d) => y(d.row) + 1)
    .attr('width', (d) => x(new Date(d.timestamp).getTime() + hour) - x(new Date(d.timestamp)) - 1)
    .attr('height', y.bandwidth() - 2 )
    .attr('rx', 3)
    .attr('fill', (d) => {
      if (colorCell)
        return colorCell(d.value, d)
      else if (d.value > 0 && d.meta.severity == 'warning')
        return colors.orange
      else
        return d.value == 0 ? colors.green : colorScale(d.value)
    })
    .attr('z-index', 1)
    .on('mouseenter', function(evt, data) {
      // showGuide(this, svg, y)
      d3.select(this).attr('opacity', 0.85)
        .attr('stroke-width', 3)

      showTooltip(evt, data)
    })
    .on('mouseleave', function() {
      d3.select('.guide').remove()
      d3.select(this).attr('opacity', 1.0)
      tt.style('display', 'none')
    })


  // add y axis (with overlay)
  svg.append('g')
    .append('rect')
    //.attr('transform', `translate(${margin.left}, ${margin.top})`)
    .attr('fill', '#fff')
    .attr('x', 0)
    .attr('y', margin.top)
    .attr('width', margin.left)
    .attr('height', height)

  svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
    .call(labelAxis)


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
      .style('top', `${evt.pageY}px`)
      .style('left', `${evt.pageX + 10}px`)

    tt.style('display', null)
  }

  /**
   *  panning/zooming
   **/
  svg.call(zoom)

  function zoomed(e) {
    const newScale = e.transform.rescaleX(x)

    cells.selectAll('.cell')
      .attr('x', (d) => newScale(new Date(d.timestamp)))
      .attr('width', (d) => newScale(new Date(d.timestamp).getTime() + hour) - newScale(new Date(d.timestamp)) - 1)

    gX.call(timeAxis.scale(newScale))
  }

}




type Record = {
  timestamp: string
  value: number
  meta?: object
}

type TimelineProps = {
  data: Record[] | { [key: string]: {}[] }
  yFormat?: (label) => string
  tooltip?: (item: Record) => string  // update to use React.FC?
  colorCell?: (val: number, item: Record) => string
  onCellClick?: (evt: React.MouseEvent) => void
  onRowClick?: (evt: React.MouseEvent) => void
}



function Chart(props: TimelineProps) {
  const {
    data,
    ...rest
  } = props


  const ref = useRef()

  useLayoutEffect(() => {
    let yLabels, chartData
    if (Array.isArray(data)) {
      yLabels = data.map(o => o.meta.node)
      chartData = parseData(data)
    } else if (typeof data == 'object') {
      yLabels = Object.keys(data)
      chartData = parseData(data)
    }

    initChart(ref.current, {
      data: chartData,
      yLabels,
      ...rest
    })
  }, [data])

  return (
    <div ref={ref}></div>
  )
}



export default function TimelineContainer(props: TimelineProps) {
  return (
    <Root>
      <Chart {...props} />
    </Root>
  )
}

const Root = styled.div`
  margin-top: 50px;
`

