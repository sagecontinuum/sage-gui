import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

import * as ECR from '../../api/ecr'

type Props = {
  app: string
}

export default function App(props: Props) {
  const { app } = props

  const [data, setData] = useState(null)

  useEffect(() => {
    ECR.getApp(app)
      .then(data => {
        setData(data)
      })
  }, [app])

  if (!data) return <></>

  return (
    <Root>
      <h2>{data.name} <small className="muted">{data.version}</small></h2>
      <p>{data.description}</p>

      <h4>App Config</h4>
      <pre>
        {JSON.stringify(data, null, 4)}
      </pre>
    </Root>
  )
}


const Root = styled.div`
`