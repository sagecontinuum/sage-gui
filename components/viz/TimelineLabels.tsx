import { useState, useEffect } from 'react'
import styled from 'styled-components'

import { type TimelineProps } from './Timeline'


type Props = {
  labels: string[]
  data: TimelineProps['data']
  formatter: TimelineProps['yFormat']
  margin: {left?: number}
}

export default function TimelineLabels(props: Props) {
  const {formatter, data} = props

  const [labels, setLabels] = useState(props.labels)

  useEffect(() => {
    setLabels(props.labels)
  }, [props.labels])


  return (
    <Root>
      <div className="labels">
        {labels.map(label =>
          <div key={label} className="label">
            {formatter ? formatter(label, data) : label}
          </div>
        )}
      </div>
    </Root>
  )
}

const Root = styled.div`
  margin: -1px 2px 0 0;
  white-space: nowrap;
  text-align: end;
  font-weight: bold;

  .label {
    height: 15px;
    font-size: .8rem;
  }
`
