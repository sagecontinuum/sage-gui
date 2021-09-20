import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

import 'chartjs-plugin-datalabels'
import chartTooltip from '../chartTooltip'

import SummaryBar from './SummaryBar'
import SummaryBox from './SummaryBox'

import * as BK from '../../../apis/beekeeper'

const barColors = {
  'active': '#3ac37e',
  'failed': '#a30f0f',
  'not updating': '#a30f0f',
  'inactive': '#aaa'
}


type Issues = {
  tests: number
}

function getIssues(data) : Issues {
  const tests = data.reduce((acc, obj) => {
    const newTotal = acc + (obj?.sanity?.nx?.failed || 0)
    return newTotal
  }, 0)

  return {tests}
}


type Status = {
  active: number,
  failed: number,
  inactive: number
  'not updating'?: number
}


function getStatus(data: BK.State[]) : Status {
  const statuses = data.reduce((acc, o) => {
    acc.active += o.status == 'active' ? 1 : 0,
    acc.failed += o.status == 'failed' ? 1 : 0,
    acc.inactive += o.status == 'inactive' ? 1 : 0
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
    setStatuses({active, 'not updating': failed, inactive })

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
          <SummaryBox label="Temps" value={issues.temps}/>
          <SummaryBox label="FS Util" value={issues.fsUtil}/>
        </div>
      }

      <ChartsContainer>
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
  width: 300px;
  margin-right: 200px;
`