import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import ErrorMsg from '../ErrorMsg'

import {useProgress} from '../../components/progress/Progress'
import * as ECR from '../apis/ecr'


export default function App() {
  const { path } = useParams()

  const { loading, setLoading } = useProgress()
  const [config, setConfig] = useState<ECR.AppConfig>({})
  const [fullConfig, setFullConfig] = useState({})
  const [error, setError] = useState(null)

  useEffect(() => {
    const [namepsace, name, version] = path.split('/')

    setLoading(true)
    Promise.all([
      ECR.getAppConfig(namepsace, name, version),
      ECR.getApp(namepsace, name, version)
    ]).then(([config, fullConfig]) => {
      setConfig(config)
      setFullConfig(fullConfig)
    }).catch(err => setError(err))
      .finally(() => setLoading(false))

  }, [path, setLoading])

  if (loading) return <></>

  return (
    <Root>
      <h2>
        {config.namespace} / {config.name} <small className="muted">{config.version}</small>
      </h2>
      <p>{config.description}</p>

      <h4>App Config</h4>
      <pre className="code">
        {JSON.stringify(config, null, 4)}
      </pre>

      {error &&
        <ErrorMsg>{error}</ErrorMsg>
      }
    </Root>
  )
}


const Root = styled.div`
`