import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

import 'chartjs-plugin-datalabels'
import { Doughnut, Line} from 'react-chartjs-2'
import chartTooltip from './chartTooltip'

import config from '../../../config'

const PIE_PADDING = 15


const colors = [{
  backgroundColor: 'rgb(32, 153, 209, .7)',
  borderColor: 'rgba(0, 0, 0, 0.2)',
}, {
  backgroundColor: 'rgb(209, 32, 71, .7)',
  borderColor: 'rgba(0, 0, 0, 0.2)',
}, {
  backgroundColor:'rgb(55, 55, 55, .7)',
  borderColor: 'rgba(0, 0, 0, 0.2)'
}
]


const defaultOptions = {
  maintainAspectRatio: false,
  animation: {
    duration: 0
  },
  layout: {
    padding: {
      left: 0,
      right: 5,
      top: 5,
      bottom: 0
    }
  },
  elements: {
    point:{
      radius: 0
    }
  },
  legend:{
    display: false,
  },
  plugins: {
    datalabels: {
      anchor: 'center',
      align:  -120,
      display: (context) => {
        return false
        // return context.dataIndex == context.dataset.data.length - 1
      },
      formatter: value => {
        return value.toFixed(2)
      }
    }
  },
  hover: {intersect: false},
  tooltips: {
    intersect: false,
    enabled: false, // disable the on-canvas tooltip
    custom: chartTooltip,
    bodyAlign: 'center',
    callbacks: {
      label: (tt, data) => {
        return `${data.datasets[0].label}: ${tt.yLabel.toFixed(2)}`
      }
    }
  }
}


const getStatuses = (data) => {
  const statuses = data.reduce((acc, o) =>[
    acc[0] + (o.status == 'active' ? 1 : 0),
    acc[1] + (o.status == 'failed' ? 1 : 0),
    acc[2] + (o.status == 'inactive' ? 1 : 0),
    acc[3] + (o.status == 'testing' ? 1 : 0)
  ]
  , [0, 0 ,0 ,0])

  return statuses
}



const getLabels = (byHost: object, key: string) => {
  // todo(nc): take any host for length?
  const labels = byHost[Object.keys(byHost)[0]][key].map((_, i) => i)
  return labels
}




type Props = {
  data: {id: string}[]
  selected: {id: string}[]
  activity: {
    [host: string]: {
      [metric: string]: number | number[]
    }
  }
}


export default function Charts(props: Props) {
  const {
    data,
    selected,
    activity
  } = props

  const [selectedIDs, setSelectedIDs] = useState(selected ? selected.map(o => o.id) : null)
  const [statuses, setStatuses] = useState([])


  useEffect(() => {
    setSelectedIDs(selected ? selected.map(o => o.id) : null)
  }, [selected])


  useEffect(() => {
    if (!data && !selectedIDs) return

    const d = selectedIDs ? data.filter(o => selectedIDs.includes(o.id)) : data
    const statuses = getStatuses(d)

    setStatuses(statuses)
  }, [data, selectedIDs])


  if (!data) return <></>

  return (
    <Root>
      <ChartsContainer>
        <StatusChart>
          {!selected?.length &&
            <Doughnut
              data={{
                labels: ['active', 'failed', 'inactive'],
                datasets: [
                  {
                    label: 'Count',
                    borderWidth: 1,
                    data: statuses.slice(0, 3),
                    backgroundColor: ['#3ac37e', '#d72020', '#aaa', '#5ddba9'],
                  }
                ]}}
              options={{
                layout: {
                  padding: {
                    left: PIE_PADDING,
                    right: PIE_PADDING,
                    top: PIE_PADDING,
                    bottom: PIE_PADDING
                  }
                },
                maintainAspectRatio: false,
                plugins: {
                  datalabels: {
                    anchor: 'end',
                    backgroundColor: function(context) {
                      return context.dataset.backgroundColor
                    },
                    display: (context) => {
                      return context.dataset.data[context.dataIndex] !== 0
                    },
                    borderColor: 'white',
                    borderRadius: 25,
                    borderWidth: 2,
                    color: 'white',
                    font: {
                      weight: 'bold'
                    },
                    padding: 6
                  }
                },
                legend: {position: 'right'}
              }}
            />
          }
        </StatusChart>

        {/* disable metric history chart(s) for now
        selected?.length && activity && Object.keys(activity).length &&
          <MetricCharts>
            <ChartTitle>
              mem%
            </ChartTitle>
            <div className="chart">
              <Line
                data={{
                  labels: getLabels(activity, 'memPercent'),
                  datasets:
                    Object.keys(activity).map((host, i) => ({
                      label: 'mem%',
                      data: activity[host].memPercent,
                      fill: true,
                      backgroundColor: colors[i].backgroundColor,
                      borderColor: colors[i].borderColor,
                      pointStyle: null,
                      lineTension: 0
                    }))
                }}
                options={{
                  ...defaultOptions,
                  scales: {
                    yAxes: [{
                      ticks: {
                        max: 100,
                        min: 0,
                        display: false,
                        maxTicksLimit: 1
                      }
                    }],
                    xAxes: [{
                      ticks: { display: false },
                      gridLines: { lineWidth: 0 }
                    }]
                  },

                }}
              />
            </div>
          </MetricCharts>
        */}
      </ChartsContainer>
    </Root>
  )
}

const Root = styled.div`
  flex-grow: 1;
  height: 300px;
`

const ChartsContainer = styled.div`
  display: flex;
  flex-direction: column;
`

const StatusChart = styled.div`
  width: 300px;
  margin-right: 200px;
`

const MetricCharts = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 10px;

  div.chart {
    height: 75px;
    margin-left: 14px;
    margin-right: 20px;
  }
`

const ChartTitle = styled.div`
  font-size: .8em;
  font-weight: 800;
  color: #666;
  margin-left: 15px;
`



