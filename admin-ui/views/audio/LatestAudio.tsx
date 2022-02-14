import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import {Link} from 'react-router-dom'

import Audio from './Audio'

import {getManifest} from '~/components/apis/beekeeper'


function AllAudios() {
  const [eles, setEles] = useState([])

  // recursively add charts
  // todo(nc): investigate api rate limitation issue!
  useEffect(() => {
    let i = 0
    function addChart(nodeList) {
      if (i >= nodeList.length)
        return

      const id = nodeList[i]

      const ele = (
        <Chart key={id}>
          <h2>Node <Link to={`/node/${id}`}>{id}</Link></h2>
          <Audio node={id} />
        </Chart>
      )

      setEles((prev) => ([...prev, ele]))
      i = i + 1

      setTimeout(() => {
        addChart(nodeList)
      }, 0)
    }

    getManifest()
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
