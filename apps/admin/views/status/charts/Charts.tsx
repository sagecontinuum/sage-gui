import { useEffect, useState } from 'react'
import styled from 'styled-components'

import SummaryBar from './SummaryBar'

import * as BK from '/components/apis/beekeeper'

const barColors = {
  'reporting': '#3ac37e',
  'failed': '#a30f0f',
  'not reporting': '#a30f0f',
  'not reporting (30d+)': '#aaa'
}


type Status = {
  'reporting': number,
  'not reporting': number
 //   'not reporting (30d+)': number
}


function getStatus(data: BK.NodeState[]) : Status {
  const statuses = data.reduce((acc, o) => {
    acc['reporting'] += o.status == 'reporting' ? 1 : 0,
    acc['not reporting'] += o.status == 'not reporting' ? 1 : 0
    // acc['not reporting (30d+)'] += o.status == 'not reporting (30d+)' ? 1 : 0
    return acc
  }, {'reporting': 0, 'not reporting': 0, 'not reporting (30d+)': 0})

  return statuses
}


type Props = {
  data: BK.NodeState[]
  column?: boolean
}


export default function Charts(props: Props) {
  const {
    data,
    column
  } = props

  const [statuses, setStatuses] = useState<Status>({
    'reporting': null,
    'not reporting': null
  })

  useEffect(() => {
    if (!data) return

    const status = getStatus(data)
    setStatuses({
      'reporting': status['reporting'],
      'not reporting': status['not reporting'],
      // 'not reporting (30d+)': status['not reporting (30d+)']
    })
  }, [data])


  if (!data) return <></>

  return (
    <Root className={`${column ? 'flex column' : 'flex flex-grow'} space-between`}>
      <div className="summary-bar">
        <SummaryBar
          values={statuses}
          color={barColors}
        />
      </div>
    </Root>
  )
}

const Root = styled.div`

  .summary-bar {
    flex-grow: 1;
    margin-bottom: 30px;
  }

  .summary-boxes {
    flex-grow: 1;
  }
`

