import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

import * as ECR from '../../apis/ecr'

type Props = {
  app: string
}

export default function App(props: Props) {
  const { app } = props
  const [namepsace, name, version] = app.split('/')

  const [data, setData] = useState(null)

  useEffect(() => {
    ECR.getApp(namepsace, name, version)
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