import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'

import d3 from './d3'





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



const height = 700
const width = 800
const hour = 60 * 60 * 1000
const day = 24 * hour


const color_scale = d3.scaleLinear()
  .domain([0, 3])
  .range(['#06af00', '#890000'])




function drawChart(
  domEle: HTMLElement,
  yLabels: string[],
  data: {row: string, meta: object, value: number}[],
  yFormat: (label: string) => string
) {

  const xScale = d3.scaleTime()
    .domain([Date.now() - 2 * day, Date.now()])
    .range([0, width])

  const yScale = d3.scaleBand()
    .domain(yLabels)
    .range([height, 0])

  const timeAxis = d3.axisTop(xScale)
  const labelAxis = d3.axisLeft(yScale)

  if (yFormat) {
    labelAxis.tickFormat(yFormat)
  }

  const svg = d3.select(domEle).append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', 'translate(100, 20)')
    .call(timeAxis)
    .append('g')
    .attr('transform', 'translate(100, 0)')
    .call(labelAxis)

  svg.selectAll()
    .data(data)
    .enter()
    .append('rect')
    .attr('x', (d) => xScale(new Date(d.timestamp)) )
    .attr('y', (d) => yScale(d.row))
    .attr('width', (d) => xScale(new Date(d.timestamp).getTime() + hour) - xScale(new Date(d.timestamp)) - 1)
    .attr('height', 10)
    .attr('rx', 3)
    .attr('fill', (d) => color_scale(d.value))
    .on('mouseenter', function(evt, data) {
      d3.select(this).style('stroke', '#000')
      showTooltip(evt, data)
    })
    .on('mouseleave', function() {
      d3.select(this).style('stroke', null)
      tooltip.style('display', 'none')
    })

  const tooltip = d3.select(domEle)
    .selectAll('#tooltip')
    .data([null])
    .join('div')
    .attr('id', 'tooltip')
    .style('position', 'absolute')
    .style('display', 'none')
    .style('background', '#000')
    .style('color', '#fff')
    .style('padding', '1em')


  const showTooltip = (evt, data) =>{
    tooltip
      .html(
        `${new Date(data.timestamp).toDateString()} ${new Date(data.timestamp).toLocaleTimeString()}<br>
        ${data.value == 0 ? 'passed' : (data.meta.severity == 'warning' ? 'warning' : 'failed')}<br>
        value: ${data.value}`
      )
      .style('top', `${evt.y}px`)
      .style('left', `${evt.x + 10}px`)

    tooltip.style('display', null)
  }
}



type TimelineProps = {
  data: {
    [key: string]: {}[]
  }
}


function Chart(props: TimelineProps) {
  const {data} = props

  const ref = useRef()

  useEffect(() => {
    const yLabels = Object.keys(data)
    const chartData = parseData(data)

    const yFormat = l => l.split('.').pop()

    drawChart(ref.current, yLabels, chartData, yFormat)
  }, [data])

  return (
    <div ref={ref}></div>
  )
}


export default function TimelineContainer(props: TimelineProps) {
  return (
    <Root>
      <Chart data={props.data} />
    </Root>
  )
}

const Root = styled.div`
  margin-top: 50px;
`

