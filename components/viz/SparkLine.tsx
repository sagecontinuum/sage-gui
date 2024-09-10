import { useRef, useEffect, useState } from 'react'
import styled from 'styled-components'

import type { Record } from '/components/apis/beehive'

import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  LineController,
  BarController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  BarElement,
  CategoryScale,
  Title,
  Decimation,
  type ChartConfiguration
} from 'chart.js'
import { getLineDatasets } from '/apps/sage/data-stream/TimeSeries'

ChartJS.register(
  Tooltip, Legend, LineController, BarController, LineElement, PointElement,
  LinearScale, TimeScale, CategoryScale, BarElement, Title, Decimation
)


const lineConfig: ChartConfiguration = {
  type: 'line',
  options: {
    events: [],
    animation: false,
    responsive: false,
    interaction: {
      mode: 'nearest',
      intersect: false
    },
    scales: {
      x: {
        type: 'time',
        display: false,
      },
      y: {
        display: false,
      }
    },
    plugins: {
      legend: {
        display: false,
        labels: {
          // @ts-ignore
          display: false
        }
      },
      tooltip: {
        enabled: false
      }
    }
  }
}



type Props = {
  data: Record[]
}

export default function SparkLine(props: Props) {
  const {data} = props

  const ref = useRef(null)
  const [chart, setChart] = useState(null)

  useEffect(() => {
    if (!data) return
    if (chart) {
      chart.destroy()
    }

    const datasets = getLineDatasets(data, {showLines: true, showPoints: false})

    const config = {
      ...lineConfig,
      data: {datasets}
    }

    const c = new ChartJS(ref.current, config)

    setChart(c)
  }, [data])


  return (
    <Root>
      <canvas ref={ref}></canvas>
    </Root>
  )
}

const Root = styled.span`
  canvas {
    max-height: 50px;
    min-width: 100%;
    max-width: 50px;
  }
`