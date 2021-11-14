import React, { useState, useEffect } from 'react'
import { useHistory, Link} from 'react-router-dom'
import styled from 'styled-components'

import * as BH from '../../apis/beehive'

import { useProgress } from '../../../components/progress/ProgressProvider'


import TimelineChart from '../../viz/TimelineChart'



export default function TestView() {
  const history  = useHistory()

  const { setLoading } = useProgress()
  const [chartData, setChartData] = useState(null)

  useEffect(() => {
    setLoading(true)
    BH.getDailyChart()
      .then((data) => setChartData(data))
      .finally(() => setLoading(false))

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

      <h2 className="flex justify-between items-center">
        Test Overview
        <small><Link to="/tests/old">go to old tests view</Link></small>
      </h2>
      {chartData &&
        <TimelineChart
          data={chartData}
          onRowClick={handleLabelClick}
          onCellClick={handleCellClick}
          tooltip={(item) =>
            `${new Date(item.timestamp).toDateString()}<br>
            ${new Date(item.timestamp).toLocaleTimeString()} - ${new Date(new Date(item.timestamp).getTime() + 60*60*1000).toLocaleTimeString()}<br>
            ${item.value == 0 ? 'passed' : (item.meta.severity == 'warning' ? 'warning' : 'failed')}
            (${item.value} issue${item.value == 1 ? '' : 's'})<br><br>
            <small>(click for details)</small>
            `
          }
          showLegend
        />
      }

    </Root>
  )
}

const Root = styled.div`
 h2 {
   width: 100%;
 }
`
