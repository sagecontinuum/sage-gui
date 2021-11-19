
import React from 'react'
import styled from 'styled-components'

import Check from '@mui/icons-material/CheckCircleRounded'

type StatusProps = {
  label: string
  value: number | string
}

export default function SummaryBox(props: StatusProps) {
  const {label, value} = props

  return (
    <Root {...props} className="flex-grow">
      <div>{label}</div>

      <div>
        {value ?
          <div className="flex items-center">
            <span className="status-value">{value}</span>&nbsp;{value != 'n/a' &&
               <div className="sub-text"><div>recent</div>issue{value > 1 ? 's' : ''}</div>
            }
          </div> :
          <div className="flex items-center status-value"><Check/>&nbsp;ok</div>
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
    font-size: 2.5em;
  }

  .sub-text {
    font-size: .8em;
  }

  :hover {
    text-decoration: none;
    opacity: .8;
  }

  border-radius: 3px;
`