import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import styled from 'styled-components'

import * as BH from '../../apis/beehive'

import { useProgress } from '../../../components/progress/ProgressProvider'

import {getMetricBins } from '../../viz/dataUtils'
import TimelineChart from '../../viz/TimelineChart'



function getChartData(data) {
  const d = {}
  Object.keys(data)
    .forEach(node => d[node] = data[node.toLowerCase()][`${node.toLowerCase()}.ws-nxcore`])

  // reduce data
  const nodes = Object.keys(d)
  const aggData = nodes.reduce((acc, name) => ({...acc, [name]: []}), {})
  nodes.forEach(node => {
    const metricKeys = Object.keys(d[node])
    metricKeys.forEach(metric => aggData[node] = [...aggData[node], ...d[node][metric]])
  })

  const bins = getMetricBins(Object.values(aggData))

  // reduce into single values by hour
  const chartData = nodes.reduce((acc, name) => ({...acc, [name]: []}), {})
  for (const [node, entries] of Object.entries(aggData)) {
    const groups = []

    for (let j = 0; j < bins.length; j++) {
      const l = bins[j]
      const u = bins[j + 1]

      const matches = entries.filter(item => {
        const timestamp = item.timestamp
        const d = new Date(timestamp)
        return l <= d && d < u
      })

      if (!matches.length)
        continue

      const sumOfValues = matches.reduce((acc, item) => acc + item.value, 0)
      const isFatal = matches.filter(item => item.value > 0 && item.meta.severity == 'fatal').length > 0
      const isWarning = matches.filter(item => item.value > 0 && item.meta.severity == 'warning').length > 0

      const entry = {
        timestamp: l,
        value: sumOfValues,
        meta: {
          severity: isFatal ? 'fatal' : (isWarning ? 'warning' : 'fatal'),
          node
        },
        details: matches
      }

      groups.push(entry)
    }

    chartData[node] = groups
  }
  return {bins, chartData}
}




export default function TestView() {
  const history  = useHistory()

  const { setLoading } = useProgress()
  const [chartData, setChartData] = useState(null)
  // const [bins, setBins] = useState(null)


  useEffect(() => {
    setLoading(true)
    BH.getSanityChart()
      .then((data) => {
        const { chartData } = getChartData(data)
        setChartData(chartData)
      }).finally(() => setLoading(false))

  }, [setLoading])


  const handleCellClick = (item) => {
    history.push(`/node/${item.meta.node}`)
  }

  const handleLabelClick = (label) => {
    history.push(`/node/${label.toUpperCase()}`)
  }


  return (
    <Root>
      <h1>All Nodes</h1>

      <h2 className="no-margin">Test Overview</h2>
      {chartData &&
        <TimelineChart
          data={chartData}
          onRowClick={handleLabelClick}
          onCellClick={handleCellClick}
          tooltip={(item) =>
            `${new Date(item.timestamp).toDateString()}<br>
            ${new Date(item.timestamp).toLocaleTimeString()} - ${new Date(new Date(item.timestamp).getTime() + 60*60*1000).toLocaleTimeString()}<br>
            ${item.value == 0 ? 'passed' : (item.meta.severity == 'warning' ? 'warning' : 'failed')}<br><br>
            <small>(click for details)</small>`
            // (${item.value} issue${item.value == 1 ? '' : 's'})`
          }
        />
      }
    </Root>
  )
}

const Root = styled.div`

`


const Charts = styled.div`

`
