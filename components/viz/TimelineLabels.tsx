import { useState, useEffect } from 'react'
import styled from 'styled-components'

import { TimelineProps } from './Timeline'


type Props = {
  labels: string[]
  formatter: TimelineProps['yFormat']
  margin: {left?: number}
}

export default function TimelineLabels(props: Props) {
  const {formatter} = props

  const [labels, setLabels] = useState(props.labels)

  useEffect(() => {
    setLabels(props.labels)
  }, [props.labels])


  return (
    <Root>
      <div className="labels" style={{width: props.margin.left}}>
        {labels.map(label =>
          <div key={label} className="label">
            {formatter ? formatter(label) : label}
          </div>
        )}
      </div>
    </Root>
  )
}

const Root = styled.div`
  position: relative;
  text-align: end;
  font-weight: bold;

  .labels {
    position: absolute;
    top: 60px;
    padding-right: 5px;
  }

  .label {
    height: 15px;
    padding: 2px 0;
    font-size: .8rem;
  }
`
