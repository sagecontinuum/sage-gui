import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import styled from 'styled-components'

import * as BH from '../../apis/beehive'

import { useProgress } from '../../../components/progress/ProgressProvider'
import SanityChart, {getMetricBins, colorMap} from '../../SanityChart'


const CalTooltip = (date, data, dataKey) =>
  <div>
    <TTitle>{date.toDateString()}</TTitle>
    {data &&
        <>
          <Count>{data[dataKey]} failed tests</Count>
        </>
    }
  </div>



const TTitle = styled.div`
  font-size: 1.2em;
  border-bottom: 1px solid #fff;
  padding-bottom: 5px;
  margin-bottom: 5px;
`

const Count = styled.div`
  font-size: 1.2em;
`


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
  const [bins, setBins] = useState(null)


  useEffect(() => {
    setLoading(true)
    BH.getSanityChart()
      .then((data) => {
        const { bins, chartData } = getChartData(data)
        setBins(bins)
        setChartData(chartData)
      }).finally(() => setLoading(false))

  }, [setLoading])


  const handleCellClick = (obj) => {
    history.push(`/node/${obj.item.meta.node}`)
  }

  const handleLabelClick = (obj) => {
    history.push(`/node/${obj.label.toUpperCase()}`)
  }


  return (
    <Root>
      <h1>All Nodes</h1>

      <h2 className="no-margin">Test Overview</h2>
      {chartData &&
        <SanityChart
          data={chartData}
          height={1000}
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
          onRowClick={handleLabelClick}
          onCellClick={handleCellClick}
        />
      }
    </Root>
  )
}

const Root = styled.div`
  margin: 0 20px;
`


const Charts = styled.div`

`
