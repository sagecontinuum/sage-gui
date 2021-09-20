import React from 'react'
import styled from 'styled-components'


const barHeight = '10px'
const barWidth = '100%'


type StatusProps = {
  values: {[key: string]: number}
  color: {[key: string]: string}
  ignoreZeroValues?: boolean
}

export default function SummaryBox(props: StatusProps) {
  const {
    values,
    color,
    ignoreZeroValues = true
  } = props

  const sum = Object.values(values).reduce((acc, v) => acc + v, 0)

  return (
    <Root>
      <Bar>
        {Object.entries(values)
          .filter(([_, val]) => ignoreZeroValues && val)
          .map(([key, val]) =>
            <Segment key={key} width={val / sum * 100} color={color[key]} />
          )}
      </Bar>
      <Labels>
        {Object.entries(values)
          .filter(([_, val]) => ignoreZeroValues && val)
          .map(([key, val]) =>
            <Label key={key} >
              <Dot color={color[key]} /> {val} {key}
            </Label>
          )}
      </Labels>

    </Root>
  )
}


const Root = styled.div`
  margin-bottom: 30px;
`

const Bar = styled.div`
  width: ${barWidth};
  height: 10px;
  display: flex;

  div:first-child { border-radius: 3px 0 0 3px; }
  div:last-child { border-radius: 0 3px 3px 0; }
`

const Segment = styled.div<{width: number, color: string}>`
  width: ${props => props.width}%;
  height: ${barHeight};
  background: ${props => props.color};
  margin-right: 1px;
`

const Labels = styled.div`
  display: flex;
  gap: 30px;
  margin-top: 10px;
`

const Label = styled.div`
  opacity: .8;
  display: flex;
  align-items: center;
`

const Dot = styled.div<{color: string}>`
  display: inline-block;
  height: 12px;
  width: 12px;
  border-radius: 50%;
  margin-right: 3px;
  background-color: ${props => props.color};
`
