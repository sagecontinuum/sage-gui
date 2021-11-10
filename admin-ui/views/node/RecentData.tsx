
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Tooltip from '@material-ui/core/Tooltip'
import DownloadIcon from '@mui/icons-material/CloudDownloadOutlined'
import WarningIcon from '@mui/icons-material/WarningRounded'

import Audio from '../audio/Audio'
import * as BH from '../../apis/beehive'

import {bytesToSizeSI, msToTime} from '../../../components/utils/units'


export function isOldData(timestamp, grain = 'hours', amount = 2) {
  let date = new Date(timestamp)

  let d
  if (grain == 'hours') {
    d = new Date()
    d.setHours(d.getHours() - amount)
  } else if (grain == 'minutes') {
    d = new Date()
    d.setMinutes(d.getMinutes() - amount)
  }

  return date < d
}


type Props = {
  node: string
}

export default function RecentData(props: Props) {
  const {node} = props

  const [images, setImages] = useState<{[pos: string]: BH.StorageRecord}>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState()

  const [total, setTotal] = useState<{[pos: string]: number}>()
  const [progress, setProgress] = useState<{[pos: string]: number}>()

  useEffect(() => {
    setLoading(true)
    BH.getRecentImages(node.toLowerCase(), onStart, onProgress)
      .then(images => {
        const hasData = !!Object.keys(images).filter(k => images[k]).length
        setImages(hasData ? images : null)
        setLoading(false)
      }).catch((err) => {
        setError(err)
      }).finally(() => setLoading(false))
  }, [node])


  const onStart = (position, total) => {
    setTotal(prev => ({...prev, [position]: total}))
  }

  const onProgress = (position, count) => {
    setProgress(prev => ({...prev, [position]: count}))
  }

  return (
    <Root className="flex column">
      <h2>Recent Images</h2>
      {images &&
        BH.cameraOrientations.map(pos => {
          if (!images[pos])
            return

          const title = `${pos.charAt(0).toUpperCase()}${pos.slice(1)}`
          const {timestamp, size, value} = images[pos]

          return (
            <div key={pos}>
              <h3>{title}</h3>
              <img
                src={value}
                style={isOldData(timestamp) ? {border: '10px solid red'} : {}}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div>
                    {isOldData(timestamp) && <WarningIcon className="failed"/>}
                  </div>

                  <Tooltip title={new Date(timestamp).toLocaleString()} placement="top">
                    <b className={isOldData(timestamp) ? 'failed' : 'muted'}>
                      ~{msToTime(new Date().getTime() - new Date(timestamp).getTime())}
                    </b>
                  </Tooltip>
                </div>
                <Button startIcon={<DownloadIcon />} size="small" href={value}>
                  {bytesToSizeSI(size)}
                </Button>
              </div>
            </div>
          )
        })
      }

      {loading && total && progress &&
        BH.cameraOrientations.map(pos => {
          return total[pos] && total[pos] != progress[pos] &&
            <span key={pos}><b>{pos}</b>: Searching {progress[pos]} of {total[pos]}</span>
        })
      }

      {!loading && !images &&
        <p className="muted">No recent images available</p>
      }

      <h2>Audio</h2>
      <Audio node={node} />

      {error &&
        <Alert severity="error">
          {error.message}
        </Alert>
      }
    </Root>
  )
}

const Root = styled.div`
  img {
    max-width: 100%;
    margin: 1px;
  }
`
