import { useRef, useEffect, useState } from 'react'
import styled from 'styled-components'
import { schemeCategory10 } from 'd3-scale-chromatic'

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

import 'chartjs-adapter-date-fns'

ChartJS.register(
  Tooltip, Legend, LineController, BarController, LineElement, PointElement,
  LinearScale, TimeScale, CategoryScale, BarElement, Title, Decimation
)


const config: ChartConfiguration = {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        fill: true,
        pointRadius: 0,
        borderWidth: 1,
        borderColor: schemeCategory10[0],
        data: []
      }
    ]
  },
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
        display: false
      },
      y: {
        display: false
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
  data: {timestamp: string, value: number }[]
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

    const d = data.map(o => o.value)

    config.data.labels = data.map(o => o.timestamp)
    config.data.datasets[0].data = d
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