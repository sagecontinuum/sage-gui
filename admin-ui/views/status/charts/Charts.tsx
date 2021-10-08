import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

import 'chartjs-plugin-datalabels'

import SummaryBar from './SummaryBar'
import SummaryBox from './SummaryBox'

import * as BK from '../../../apis/beekeeper'

const barColors = {
  'reporting': '#3ac37e',
  'failed': '#a30f0f',
  'not reporting': '#a30f0f',
  'offline': '#aaa'
}


type Issues = {
  tests: number
  plugins: number
  temps: number
  fsUtil: number
}

function getIssues(data) : Issues {
  const tests = data.reduce((acc, obj) => {
    const total = acc + (obj?.sanity?.failed || 0)
    return total
  }, 0)

  const plugins = data.reduce((acc, obj) =>
    acc + (obj?.pluginStatus?.failed || 0)
  , 0)


  const temps = data.reduce((acc, obj) =>
    acc + (obj?.temp >= 70 ? 1 : 0)
  , 0)

  const fsUtil = data.reduce((acc, obj) => {
    return acc + (obj?.temp >= 70 ? 1 : 0)
  }, 0)

  return {tests, plugins, temps, fsUtil}
}


type Status = {
  reporting: number,
  failed: number,
  'not reporting'?: number
  offline: number
}


function getStatus(data: BK.State[]) : Status {
  const statuses = data.reduce((acc, o) => {
    acc.active += o.status == 'reporting' ? 1 : 0,
    acc.failed += o.status == 'not reporting' ? 1 : 0,
    acc.inactive += o.status == 'offline' ? 1 : 0
    return acc
  }, {active: 0, failed: 0, inactive: 0})

  return statuses
}


type Props = {
  data: {id: string}[]
  selected: {id: string}[]
  activity: {
    [host: string]: {
      [metric: string]: number | number[]
    }
  },
  lastUpdate: string

}


export default function Charts(props: Props) {
  const {
    data,
    selected,
    activity,
    lastUpdate
  } = props

  const [selectedIDs, setSelectedIDs] = useState(selected ? selected.map(o => o.id) : null)
  const [statuses, setStatuses] = useState<Status>({})

  // highlevel stats
  const [issues, setIssues] = useState<Issues>({
    tests: -1
  })


  useEffect(() => {
    setSelectedIDs(selected ? selected.map(o => o.id) : null)
  }, [selected])


  useEffect(() => {
    if (!data && !selectedIDs) return

    const d = selectedIDs ? data.filter(o => selectedIDs.includes(o.id)) : data
    const {active, failed, inactive} = getStatus(d)
    setStatuses({
      'reporting': active,
      'not reporting': failed,
      'offline': inactive
    })

    const issues = getIssues(d)
    setIssues(issues)
  }, [data, selectedIDs])


  if (!data) return <></>

  return (
    <Root>
      {selected?.length > 1 &&
        <h2>{selected.map(o => o.id).join(', ')}</h2>
      }

      {!selected?.length &&
        <Title>
          {data.length == 34 && 'All '}{data.length} Node{data.length > 1 ? 's' : ''} | <small>{lastUpdate}</small>
        </Title>
      }

      {!selected?.length &&
        <div>
          <SummaryBar
            values={statuses}
            color={barColors}
          />
        </div>

      }

      {!selected?.length &&
        <div className="flex gap flex-grow">
          <SummaryBox label="Tests" value={issues.tests}/>
          <SummaryBox label="Plugins" value={issues.plugins}/>
          <SummaryBox label="Temps" value={issues.temps}/>
          <SummaryBox label="FS Util" value={'n/a'}/>
        </div>
      }

      <ChartsContainer>
        <StatusChart></StatusChart>
      </ChartsContainer>
    </Root>
  )
}

const Root = styled.div`
  flex-grow: 1;
`

const Title = styled.h2`
  margin-top: 0;
  margin-bottom: 36px;
`

const ChartsContainer = styled.div`
  display: flex;
  flex-direction: column;
`

const StatusChart = styled.div`


`