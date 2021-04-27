import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import ErrorMsg from '../ErrorMsg'

import Tooltip from '@material-ui/core/Tooltip'
import IconButton from '@material-ui/core/IconButton'
import MoreIcon from '@material-ui/icons/UnfoldMoreOutlined'
import LessIcon from '@material-ui/icons/UnfoldLessOutlined'
import CopyIcon from '@material-ui/icons/FileCopyOutlined'
import DoneIcon from '@material-ui/icons/DoneOutlined'

import {useProgress} from '../../components/progress/Progress'
import * as ECR from '../apis/ecr'



export default function App() {
  const { path } = useParams()

  const { loading, setLoading } = useProgress()
  const [config, setConfig] = useState<ECR.AppConfig>({})
  const [fullConfig, setFullConfig] = useState({})
  const [error, setError] = useState(null)

  const [showFullConfig, setShowFullConfig] = useState(false)
  const [isCopied, setIsCopied] = useState(false)



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



  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 4))
    setIsCopied(true)
  }


  if (loading) return <></>

  return (
    <Root>
      <h2>
        {config.namespace} / {config.name} <small className="muted">{config.version}</small>
      </h2>
      <p>{config.description}</p>

      <div className="flex items-center justify-between">
        <b>App Config</b>

        <div>
          <Tooltip title={showFullConfig ? 'Show only app config' : 'Show all details'}>
            <IconButton onClick={() => setShowFullConfig(!showFullConfig)} size="small">
              {showFullConfig ? <LessIcon fontSize="small" /> : <MoreIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title={isCopied ? 'Copied!' : 'Copy contents'}>
            <IconButton onClick={handleCopy} size="small">
              {isCopied ? <DoneIcon fontSize="small" />  : <CopyIcon fontSize="small"/>}
            </IconButton>
          </Tooltip>
        </div>
      </div>

      <pre className="code">
        {showFullConfig ?
          JSON.stringify(fullConfig, null, 4) : JSON.stringify(config, null, 4)
        }
      </pre>

      {error &&
        <ErrorMsg>{error}</ErrorMsg>
      }
    </Root>
  )
}


const Root = styled.div`
`