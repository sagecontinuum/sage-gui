import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

import Audio from '/components/viz/Audio'

import * as BK from '/components/apis/beekeeper'


function AllAudios() {
  const [eles, setEles] = useState([])

  // recursively add charts
  // todo(nc): investigate api rate limitation issue!
  useEffect(() => {
    let i = 0
    function addChart(nodeList) {
      if (i >= nodeList.length)
        return

      const vsn = nodeList[i]

      const ele = (
        <Chart key={vsn}>
          <h2>Node <Link to={`/node/${vsn}`}>{vsn}</Link></h2>
          <Audio vsn={vsn} />
        </Chart>
      )

      setEles((prev) => ([...prev, ele]))
      i = i + 1

      setTimeout(() => {
        addChart(nodeList)
      }, 0)
    }

    BK.getNodeMeta()
      .then(meta => {
        const nodeList = Object.keys(meta)
        addChart(nodeList)
      })
  }, [])


  return (
    <div>
      {eles}
    </div>
  )
}


export default function LatestAudio() {
  return (
    <Root>
      <h1>Latest Available Audio</h1>
      <AllAudios />
    </Root>
  )
}


const Root = styled.div`
  margin: 20px;
`

const Chart = styled.div`
  margin-bottom: 40px;
`
