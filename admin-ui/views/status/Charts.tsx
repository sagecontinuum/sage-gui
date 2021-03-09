import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

import 'chartjs-plugin-datalabels'
import { Doughnut, Line} from 'react-chartjs-2'
import chartTooltip from './chartTooltip'

import config from '../../../config'

const PIE_PADDING = 15
const ACTIVITY_LENGTH = config.ui.activityLength


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
        return context.dataIndex == context.dataset.data.length - 1
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


const aggregateOnField = (data, field) =>
  data.reduce((acc, o) => acc + parseFloat(o[field]), 0).toFixed(2)


const getAverage = (data, field) =>
  (data.reduce((acc, o) => acc + parseFloat(o[field]), 0) / data.length).toFixed(2)


const sumArrays = (arrs: number[], len: number) => {
  const zeros = new Array(len).fill(0)
  return arrs.reduce((acc, vals) =>
    acc.map((val, i) => parseFloat(val) + parseFloat(vals[i]) )
  , zeros)
}


const avgArrays = (arrs: number[], len: number) => {
  const zeros = new Array(len).fill(0)
  const totals = arrs.reduce((acc, vals) =>
    acc.map((val, i) => parseFloat(val) + parseFloat(vals[i]) )
  , zeros)

  return totals.map(val => val / arrs.length)
}



const aggregateOnData = (data, activity) => {
  const ids = data.map(obj => obj.id)

  const activities = ids.map(id => activity[id])
  const cpuActivities = activities.map(obj => obj.cpu)
  const memActivities = activities.map(obj => obj.mem)
  const storageActivities = activities.map(obj => obj.storage)

  return {
    cpu: sumArrays(cpuActivities, cpuActivities[0]?.length),
    mem: sumArrays(memActivities, memActivities[0]?.length),
    storage: avgArrays(storageActivities, storageActivities[0]?.length)
  }
}


// helper function to pad unused label space nulls
const getLabels = (vals: number[]) => {
  return [
    ...new Array(ACTIVITY_LENGTH - vals.length).fill(null),
    ...vals.map((_, i) => i)
  ]
}

// helper function to pad data with null values
const getData = (vals: number[]) => {
  return [
    ...new Array(ACTIVITY_LENGTH - vals.length).fill(null),
    ...vals
  ]
}


type Props = {
  data: any[]
  selected: any
  activity: any
}


export default function Charts(props: Props) {
  const {data, selected, activity} = props

  const [selectedIDs, setSelectedIDs] = useState(
    selected ? selected.map(o => o.id) : null
  )

  const [statuses, setStatuses] = useState([])

  // currently unused
  const [cpuState, setCpuState] = useState([])
  const [memState, setMemState] = useState([])
  const [storageState, setStorageState] = useState([])

  const [aggActivity, setAggActivity] = useState(null)


  useEffect(() => {
    setSelectedIDs(selected ? selected.map(o => o.id) : null)
  }, [selected])


  useEffect(() => {
    if (!data && !selectedIDs) return

    const d = selectedIDs ? data.filter(o => selectedIDs.includes(o.id)) : data
    const statuses = getStatuses(d)
    setStatuses(statuses)

    /*
    const cpuVal = aggregateOnField(d, 'cpu')
    const memVal = aggregateOnField(d, 'mem')
    const storageVal = getAverage(d, 'storage')
    setCpuState([cpuVal])
    setMemState([memVal])
    setStorageState([storageVal])
    */
  }, [data, selectedIDs])


  // aggregation of activity
  useEffect(() => {
    if (!data || !Object.keys(activity).length) return

    const d = selectedIDs ? data.filter(o => selectedIDs.includes(o.id)) : data
    const allActivity = aggregateOnData(d, activity)
    setAggActivity(allActivity)
  }, [data, selectedIDs, activity])


  if (!data) return <></>

  return (
    <Root>
      {selectedIDs?.length == 1 &&
        <h3>{selectedIDs[0]}</h3>
      }

      {selectedIDs?.length > 1 &&
        <h3>{selectedIDs.join(', ')}</h3>
      }

      {!selected &&
        <MainTitle>
          {data.length == 34 && 'All '}{data.length} Node{data.length > 1 ? 's' : ''}
        </MainTitle>
      }

      <ChartsContainer>
        <TopCharts>
          {!selected &&
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
                      return context.dataset.backgroundColor;
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
        </TopCharts>

        {aggActivity &&
          <BottomCharts>

            <ChartTitle>
              % cpu | {(100 * (selected ? selected.length : data.length)).toLocaleString()} total
            </ChartTitle>
            <div className="chart">
              <Line
                data={{
                  labels: getLabels(aggActivity.cpu),
                  datasets: [
                    {
                      label: '% cpu',
                      data: getData(aggActivity.cpu),
                      fill: true,
                      backgroundColor: 'rgb(32, 153, 209, .7)',
                      borderColor: 'rgba(0, 0, 0, 0.2)',
                      pointStyle: null,
                      lineTension: 0
                    }
                  ]
                }}
                options={{
                  ...defaultOptions,
                  scales: {
                    yAxes: [{
                      ticks: {
                        max: 100 * (selected ? selected.length : data.length),
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

            <ChartTitle>
              mem | {(192 * (selected ? selected.length : data.length)).toLocaleString()} GB available
            </ChartTitle>
            <div className="chart">
              <Line
                data={{
                  labels: getLabels(aggActivity.mem),
                  datasets: [
                    {
                      label: 'mem (gb)',
                      data: getData(aggActivity.mem),
                      fill: true,
                      backgroundColor: 'rgb(209, 32, 71, .7)',
                      borderColor: 'rgba(0, 0, 0, 0.2)',
                      pointStyle: null,
                      lineTension: 0
                    }
                  ]
                }}
                options={{
                  ...defaultOptions,
                  scales: {
                    yAxes: [{
                    ticks: {
                        max: 192 * (selected ? selected.length : data.length),
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

            <ChartTitle>
              storage%
            </ChartTitle>
            <div className="chart">
              <Line
                data={{
                  labels: getLabels(aggActivity.storage),
                  datasets: [
                    {
                      label: 'storage%',
                      data: getData(aggActivity.storage),
                      fill: true,
                      backgroundColor: 'rgb(55, 55, 55, .7)',
                      borderColor: 'rgba(0, 0, 0, 0.2)',
                      pointStyle: null,
                      lineTension: 0
                    }
                  ]
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
                      },
                    }],
                    xAxes: [{
                      ticks: { display: false },
                      gridLines: { lineWidth: 0 }
                    }]
                  }
                }}
              />
            </div>
          </BottomCharts>
        }
      </ChartsContainer>
    </Root>
  )
}

const Root = styled.div`
  flex-grow: 1;
  height: 300px;
`

const MainTitle = styled.h3`
  margin: 0 0 0px 15px;
`


const ChartsContainer = styled.div`
  display: flex;
  flex-direction: column;
`

const TopCharts = styled.div`
  width: 300px;
`

const BottomCharts = styled.div`
  display: flex;
  flex-direction: column;

  div.chart {
    width: 500px;
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



