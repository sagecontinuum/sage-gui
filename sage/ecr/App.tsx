import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'

import LaunchIcon from '@material-ui/icons/LaunchRounded'

import ErrorMsg from '../ErrorMsg'
import RepoActions from './RepoActions'

import {useProgress} from '../../components/progress/ProgressProvider'
import * as ECR from '../apis/ecr'

import Versions from './Versions'



export default function App() {
  const { path } = useParams()

  const { loading, setLoading } = useProgress()
  const [repo, setRepo] = useState<ECR.AppConfig>(null)
  const [versions, setVersions] = useState(null)
  const [isPublic, setIsPublic] = useState(null)
  const [error, setError] = useState(null)


  useEffect(() => {

    const [namespace, name ] = path.split('/')

    setLoading(true)
    Promise.all([
      ECR.getRepo({namespace, name}),
      ECR.listPermissions({namespace, name})
    ]).then(([repo, perms]) => {
      setRepo(repo)
      setVersions(repo.versions)
      setIsPublic(ECR.isPublic(perms))
    }).catch(err => setError(err))
      .finally(() => setLoading(false))

  }, [path, setLoading])



  const handleActionComplete = () => {
    // todo: implement
  }

  if (loading || !repo) return <></>

  return (
    <Root>
      <h1 className="flex justify-between">
        {repo.namespace} / {repo.name}

        <div className="actions">
          <RepoActions
            namespace={repo.namespace}
            name={repo.name}
            version={repo.version}
            condensed={false}
            onComplete={handleActionComplete}
            versionCount={versions.length}
            isPublic={isPublic}
          />
        </div>
      </h1>

      <p>{repo.versions[0]?.description}</p>

      <b>Repo:</b> <a href={repo.versions[0]?.source.url} target="_blank" rel="noreferrer">
        {repo.versions[0]?.source.url} <LaunchIcon className="external-link"/>
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