
import React from 'react'
import styled from 'styled-components'

import Check from '@material-ui/icons/CheckCircleRounded'

type StatusProps = {
  label: string
  value: number
}

export default function SummaryBox(props: StatusProps) {
  const {label, value} = props

  return (
    <Root {...props} className="flex-grow">
      <div>{label}</div>

      <div className="status-value">
        {value ?
          <div className="flex items-center">
            <span>{value}</span>&nbsp;<span className="status-text">issue{value > 1 ? 's' : ''}</span>
          </div> :
          <div className="flex items-center"><Check/>&nbsp;ok</div>
        }
      </div>
    </Root>
  )
}

const Root = styled.a<{value: number}>`
  padding: 1em;
  color: #fff;
  font-weight: bold;
  background: ${props => props.value > 0 ?  '#a30f0f' : '#3ac37e'};

  .status-value {
    font-size: 2em;
  }

  .status-text {
    font-size: .4em;
  }

  :hover {
    text-decoration: none;
    opacity: .8;
  }

  border-radius: 3px;
`