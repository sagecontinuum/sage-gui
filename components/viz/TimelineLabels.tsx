import { useState, useEffect } from 'react'
import styled from 'styled-components'

import { type TimelineProps } from './Timeline'


type Props = {
  labels: string[]
  data: TimelineProps['data']
  formatter: TimelineProps['yFormat']
  margin: {left?: number}
  rowHeightPx?: number
}

export default function TimelineLabels(props: Props) {
  const {formatter, rowHeightPx = 15} = props

  const [labels, setLabels] = useState(props.labels)

  useEffect(() => {
    setLabels(props.labels)
  }, [props.labels])


  return (
    <Root rowHeightPx={rowHeightPx}>
      <div className="labels">
        {labels.map(label =>
          <div key={label} className="label">
            {formatter ? formatter(label) : label}
          </div>
        )}
      </div>
    </Root>
  )
}

const Root = styled.div<{rowHeightPx: number}>`
  margin: -1px 2px 0 0;
  white-space: nowrap;
  text-align: end;
  font-weight: bold;

  .label {
    height: ${(props) => props.rowHeightPx}px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    font-size: .8rem;
  }
`
