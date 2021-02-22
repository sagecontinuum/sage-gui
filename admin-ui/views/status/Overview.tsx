import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

import 'chartjs-plugin-datalabels'
import { Doughnut, Line} from 'react-chartjs-2'


const PIE_PADDING = 15
const ACTIVITY_LENGTH = 50


const defaultOptions = {
  maintainAspectRatio: false,
  animation: {
    duration: 0
  },
  layout: {
    padding: {
        left: 0,
        right: 5,
        top: 20,
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
    cpu: sumArrays(cpuActivities, cpuActivities[0].length).slice(-ACTIVITY_LENGTH),
    mem: sumArrays(memActivities, memActivities[0].length).slice(-ACTIVITY_LENGTH),
    storage: avgArrays(storageActivities, storageActivities[0].length).slice(-ACTIVITY_LENGTH)
  }
}


type Props = {
  data: any[]
  selected: any
  activity: any
}


function Overview(props: Props) {
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
        <h3 style={{margin: '0 0 10px 15px'}}>
          {data.length == 34 && 'All '}{data.length} Node{data.length > 1 ? 's' : ''}
        </h3>
      }

      <Charts>
        <TopCharts>
          {!selected &&
            <Doughnut
              data={{
                labels: ['active', 'failed', 'inactive'],
                datasets: [
                {
                  label: 'Count',
                  //borderColor: 'rgba(0,0,0,1)',
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
                    display: function(context) {
                      var dataset = context.dataset;
                      var count = dataset.data.length;
                      var value = dataset.data[context.dataIndex];
                      // return value > count * 1.5;
                      return true
                    },
                    font: {
                      weight: 'bold'
                    },
                    padding: 6,
                    formatter: Math.round
                  }
                },
                legend: {position: 'right'}
              }}

            />
          }
        </TopCharts>
        <br/>
        {aggActivity &&
          <BottomCharts>

            <div>
              <Line
                data={{
                  labels: aggActivity.cpu.map((_, i) => -i),
                  datasets: [
                    {
                      label: '% cpu',
                      data: aggActivity.cpu,
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
                        steps: 2
                      },
                    }],
                    xAxes: [{ ticks: {
                      display: false,
                    }}]
                  }
                }}
              />
            </div>

            <div>
              <Line
                data={{
                  labels: aggActivity.mem.map((_, i) => -i),
                  datasets: [
                    {
                      label: 'mem (gb)',
                      data: aggActivity.mem,
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
                        steps: 2
                      }
                    }],
                    xAxes: [{ ticks: {
                      display: false,
                    }}]
                  },

                }}
              />
            </div>

            <div>
              <Line
                data={{
                  labels: aggActivity.storage.map((_, i) => -i),
                  datasets: [
                    {
                      label: 'storage',
                      data: aggActivity.storage,
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
                        steps: 100
                      },
                    }],
                    xAxes: [{ ticks: {
                      display: false,
                    }}]
                  }
                }}
              />
            </div>
          </BottomCharts>
        }


        {selected?.length && <h3 style={{margin: '40px auto 40px auto'}}>What should go in this pane?</h3>}
      </Charts>

    </Root>
  )
}

const Root = styled.div`
  height: 300px;
  width: 500px;

`

const Charts = styled.div`
  display: flex;
  flex-direction: column;
`

const TopCharts = styled.div`
  width: 300px;

`

const BottomCharts = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;

  div {
    width: 500px;
    height: 75px;
    margin-left: 14px;
  }

  div {
    margin-right: 20px;
  }
`

export default Overview


