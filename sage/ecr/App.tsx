import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'

import LaunchIcon from '@material-ui/icons/LaunchRounded'

import ErrorMsg from '../ErrorMsg'
import AppActions from './AppActions'

import {useProgress} from '../../components/progress/Progress'
import * as ECR from '../apis/ecr'

import Versions from './Versions'


function TagsTable(props) {
  const {versions} = props

  return (
    <table className="stiped">
      <thead>
        <tr><th>Tag</th></tr>
      </thead>
      <tbody>
        {versions.map(obj => {
          const {version} = obj
          return <tr key={version}><td>{version}</td></tr>
        })}
      </tbody>
    </table>
  )
}


export default function App() {
  const { path } = useParams()

  const { loading, setLoading } = useProgress()
  const [config, setConfig] = useState<ECR.AppConfig>(null)
  const [versions, setVersions] = useState(null)
  const [error, setError] = useState(null)


  useEffect(() => {

    const [namespace, name, version] = path.split('/')

    setLoading(true)
    Promise.all([
      ECR.getAppConfig({namespace, name, version}),
      ECR.listVersions({namespace, name})
    ]).then(([config, versions]) => {
      setConfig(config)
      setVersions(versions)
    }).catch(err => setError(err))
      .finally(() => setLoading(false))

  }, [path, setLoading])



  const handleActionComplete = () => {
    // todo: implement
  }

  if (loading || !config) return <></>

  return (
    <Root>
      <h2 className="flex justify-between">
        {config.namespace} / {config.name}

        <div className="actions">
          <AppActions
            namespace={config.namespace}
            name={config.name}
            version={config.version}
            condensed={false}
            onComplete={handleActionComplete}
          />
        </div>
      </h2>

      <p>{config.description}</p>

      <b>Repo:</b> <a href={config.source.url} target="_blank" rel="noreferrer">
        {config.source.url} <LaunchIcon className="external-icon"/>
      </a>

      {error &&
        <ErrorMsg>{error}</ErrorMsg>
      }

      {versions &&
        <Versions
          versions={versions} />
      }

    </Root>
  )
}


const Root = styled.div`
`