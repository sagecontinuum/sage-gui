import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

import {fetchProjectMeta} from '../apis/beekeeper'

import * as BH from '../apis/beehive'


export default function Stress() {

  const [query, setQuery] = useState<object>()
  const [nodeIds, setNodeIds] = useState([])

  useEffect(() => {
    // get node list
    fetchProjectMeta()
      .then(async meta => {
        const nodeIds = Object.keys(meta)
        setNodeIds(nodeIds)


        const [prom, query] = await BH.stressTest(nodeIds[0].toLowerCase())
        setQuery(query)

        // fetch some data
        const proms = Promise.all(nodeIds.map(id => BH.stressTest(id.toLowerCase())[0] ))

        proms.catch(err => {
          console.log('err', err)
        })
      })
  }, [])

  return (
    <Root>
      <h1>A "Stress Test"</h1>

      <p>Number of queries: {nodeIds.length}</p>

      Query sample:
      <pre className="code">
        {JSON.stringify(query, null, 4)}
      </pre>
    </Root>
  )
}


const Root = styled.div`
  margin: 20px;
`

