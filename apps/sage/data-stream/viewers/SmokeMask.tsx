/**
 *
 * NOTE(!!): this is just an incomplete experiment
 */

import { useEffect, useState } from 'react'
import styled from 'styled-components'
import Slider from '@mui/material/Slider'
import * as BH from '/components/apis/beehive'

const cWidth = 20

type Props = {
  data: BH.Record[]
}

export default function SmokeMap(props: Props) {
  const {data} = props

  const [matrix, setMatrix] = useState()

  useEffect(() => {
  }, [])


  const handleChange = (event, val) => {
    let f = JSON.parse(data[val].value)
    f = f[0]

    /* assume 5 X 9 tiles // todo: this is an arbitrary assumption! */
    let m = []
    while(f.length)
      m.push(f.splice(0,9))

    setMatrix(f)
  }

  return (
    <Root>
      {/* assume 5 X 9 tiles // todo: this is an arbitrary assumption! */ }
      <svg width="600" height="500">
        {matrix &&
          matrix.map(i => {
            matrix.map(j =>
              <rect className="cell" x={i * cWidth} y={j * cWidth} width={cWidth} height={cWidth} fill="#000"/>
            )
          })
        }
      </svg>
      <Slider
        size="small"
        defaultValue={0}
        aria-label="frame slider"
        valueLabelDisplay="auto"
        onChange={handleChange}
      />
    </Root>
  )
}

const Root = styled.div`

`

const Cell = styled.div`


`
