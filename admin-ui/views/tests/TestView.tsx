import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import styled from 'styled-components'

import * as BH from '../../apis/beehive'

import { useProgress } from '../../../components/progress/ProgressProvider'
// import HeatmapCalendar from '../../../components/heatmap/src/HeatmapCalendar'
import FilterMenu from '../../../components/FilterMenu'
import Button from '@material-ui/core/Button'
import CaretIcon from '@material-ui/icons/ExpandMoreRounded'


import SanityChart, {getMetricBins, colorMap} from '../../SanityChart'
import { stringify } from 'yaml'
import { FormatColorResetOutlined } from '@material-ui/icons'
import { useCallback } from 'react'


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
  const nodes = Object.keys(data)
  nodes.forEach(node => d[node] = data[node.toLowerCase()][`${node.toLowerCase()}.ws-nxcore`])

  // get names for later use
  const metricIds = Object.keys(data[nodes[0]][`${nodes[0].toLowerCase()}.ws-nxcore`])


  // reduce data
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

  return {
    bins,
    chartData,
    metricIds
  }
}




export default function TestView() {
  const history  = useHistory()

  const { setLoading } = useProgress()
  const [chartData, setChartData] = useState(null)
  const [chartId, setChartId] = useState(null) // for rerender
  const [bins, setBins] = useState(null)


  const [options, setOptions] = useState(null)

  const initFilter = {id: 'all_tests', label: 'All Tests'}
  const [selected, setSelected] = useState<{id: string, label: string}>(initFilter)


  const updateChart = useCallback(() => {
    setLoading(true)

    const metricId = selected ? selected.id : 'all_tests'
    BH.getSanityChart(metricId !== 'all_tests' ? {metricId} : {})
      .then((data) => {
        const {bins, chartData, metricIds} = getChartData(data)
        setBins(bins)
        setChartData(chartData)
        setChartId(metricId)

        if (options) return

        const opts = metricIds.map(name => ({
          id: name,
          label: name.slice(name.lastIndexOf('.') + 1)
        }))
        setOptions(opts)
      }).finally(() => setLoading(false))
  }, [setLoading, selected])


  useEffect(() => {
    updateChart()
  }, [updateChart])


  const handleCellClick = (obj) => {
    history.push(`/node/${obj.item.meta.node}`)
  }

  const handleLabelClick = (obj) => {
    history.push(`/node/${obj.label.toUpperCase()}`)
  }

  const handleFilterChange = (sel) => {
    setSelected(sel ? sel : initFilter)
  }


  return (
    <Root>
      <h1>All Nodes</h1>

      <h2 className="no-margin">Test Overview</h2>

      {options ?
        <FilterMenu
          options={options}
          value={selected}
          multiple={false}
          disableCloseOnSelect={false}
          onChange={vals => handleFilterChange(vals)}
          ButtonComponent={
            <Button style={{marginLeft: 10}}>
              {selected ? selected.label : 'All Metrics'}
              <CaretIcon />
            </Button>
          }
        /> : <></>
      }

      {chartData &&
        <SanityChart
          id={chartId}
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


