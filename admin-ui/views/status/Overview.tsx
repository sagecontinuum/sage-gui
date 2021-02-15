import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import Button from '@material-ui/core/Button'

import 'chartjs-plugin-datalabels';
import {Bar, HorizontalBar} from 'react-chartjs-2';



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


const aggregateOnField = (data, field) => {
  return data.reduce((acc, o) => acc + parseFloat(o[field]), 0).toFixed(2)
}


const getAverage = (data, field) =>
  (data.reduce((acc, o) => acc + parseFloat(o[field]), 0) / data.length).toFixed(2)



type Props = {
  data: any[]
  selected: any
}

function Overview(props: Props) {
  const {data} = props


  const [selected, setSelected] = useState(props.selected ? [props.selected].map(o => o['Node CNAME']) : null)

  const [statuses, setStatuses] = useState([])
  const [cpuState, setCpuState] = useState([])
  const [memState, setMemState] = useState([])
  const [storageState, setStorageState] = useState([])


  useEffect(() => {
    if (!data && !selected) return

    let d = selected ? data.filter(o => selected.includes(o['Node CNAME'])) : data

    const statuses = getStatuses(d)
    const cpuState = aggregateOnField(d, 'cpu')
    const memState = aggregateOnField(d, 'mem')
    const storageState = getAverage(d, 'storage')

    setStatuses(statuses)
    setCpuState([cpuState])
    setMemState([memState])
    setStorageState([storageState])
  }, [data, selected])



  useEffect(() => {
    setSelected(props.selected ? [props.selected].map(o => o['Node CNAME']) : null)
  }, [props.selected])


  if (!data) return <></>

  return (
    <Root>
      {selected?.length && <h3>{selected[0]}</h3>}

      {!selected &&
        <h3 style={{margin: '0 0 10px 15px'}}>
          {data.length == 34 && 'All '}{data.length} Node{data.length > 1 ? 's' : ''}
        </h3>
      }

      <Charts>
        <TopCharts>
          {!selected &&
            <HorizontalBar
              data={{
                labels: ['active', 'failed', 'inactive', 'testing'],
                datasets: [
                {
                  label: 'Count',
                  borderColor: 'rgba(0,0,0,1)',
                  borderWidth: 1,
                  data: statuses,
                  backgroundColor: ['#5ddba9', '#a30f0f', 'grey', '#5ddba9']
                }
              ]}}
              options={{
                maintainAspectRatio: false,
                title:{
                  display: false,
                  text:'Node Status',
                  fontSize: 20
                },
                legend:{
                  display: false,
                },
                plugins: {
                  datalabels: {
                    display: true,
                    color: 'white'
                  }
                },
                scales: {
                  xAxes: [{
                    gridLines: {
                      display:true
                    },
                    ticks: {
                      display: false
                    }
                  }],
                  yAxes: [{
                      gridLines: {
                          display: true
                      }
                  }]
                }
              }}
            />
          }
        </TopCharts>
        <br/>

        <BottomCharts>
          <div>
            <Bar
              data={{
                labels: ['mem (gb)'],
                datasets: [
                  {
                    label: 'Count',
                    backgroundColor: 'rgba(75,192,192,1)',
                    borderColor: 'rgba(0,0,0,1)',
                    borderWidth: 1,
                    data: memState
                  }
                ]
              }}
              options={{
                maintainAspectRatio: false,
                title:{
                  display: false,
                  text:'mem',
                  fontSize: 20
                },
                legend:{
                  display: false,
                },
                scales: {
                  yAxes: [{
                    ticks: {
                      max: 192 * (selected ? selected.length : data.length),
                      min: 0,
                      steps: 2
                    }
                  }]
                },
                plugins: {
                  datalabels: {
                    display: true,
                    color: 'white'
                  }
                }
              }}
            />
          </div>

          <div>
            <Bar
              data={{
                labels: ['% cpu'],
                datasets: [
                  {
                    label: 'Count',
                    backgroundColor: 'rgba(75,192,192,1)',
                    borderColor: 'rgba(0,0,0,1)',
                    borderWidth: 1,
                    data: cpuState
                  }
                ]
              }}
              options={{
                maintainAspectRatio: false,
                title:{
                  display: false,
                  text:'cpu',
                  fontSize: 20
                },
                legend:{
                  display: false,
                },
                scales: {
                  yAxes: [{
                    ticks: {
                      max: 100 * (selected ? selected.length : data.length),
                      min: 0,
                      steps: 2
                    }
                  }]
                },
                plugins: {
                  datalabels: {
                      display: true,
                      color: 'white'
                  }
                }
              }}
            />
          </div>

          <div>
            <Bar
              data={{
                labels: ['% Storage'],
                datasets: [
                  {
                    label: 'percent:',
                    backgroundColor: 'rgba(75,192,192,1)',
                    borderColor: 'rgba(0,0,0,1)',
                    borderWidth: 1,
                    data: storageState
                  }
                ]
              }}
              options={{
                maintainAspectRatio: false,
                title:{
                  display: false,
                  text:'storage',
                  fontSize: 20
                },
                legend:{
                  display: false,
                },
                scales: {
                  yAxes: [{
                    ticks: {
                      max: 100,
                      min: 0,
                      steps: 2
                    }
                  }]
                },
                plugins: {
                  datalabels: {
                      display: true,
                      color: 'white'
                  }
                }
              }}
            />
          </div>
        </BottomCharts>


        {selected?.length && <h3 style={{margin: '40px auto 40px auto'}}>What should go in this pane?</h3>}
      </Charts>

    </Root>
  )
}

const Root = styled.div`
  height: 450px;
  width: 500px;

`

const Charts = styled.div`
  display: flex;
  flex-direction: column;
`

const TopCharts = styled.div`

`

const BottomCharts = styled.div`
  display: flex;
  height: 100%;

  div {
    width: 140px;
    height: 250px;
    margin-left: 14px;
  }

  div {
    margin-right: 20px;
  }
`

export default Overview


