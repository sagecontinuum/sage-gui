
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import DownloadIcon from '@mui/icons-material/CloudDownloadOutlined'

import Audio from '../audio/Audio'
import * as BH from '../../apis/beehive'

import {bytesToSizeSI} from '../../../components/utils/units'


type Props = {
  node: string
}

export default function LatestData(props: Props) {
  const {node} = props

  const [images, setImages] = useState<{[pos: string]: BH.Record}>()
  const [error, setError] = useState()

  useEffect(() => {
    BH.getLatestImages(node.toLowerCase())
      .then(images => {
        const hasData = !!Object.keys(images).filter(k => images[k]).length
        setImages(hasData ? images : null)
      }).catch((err) => {
        setError(err)
      })
  }, [node])

  return (
    <Root>
      <h2>Latest Images</h2>
      {images &&
        BH.cameraOrientations.map(pos => {
          if (!images[pos])
            return

          const title = `${pos.charAt(0).toUpperCase()}${pos.slice(1)}`
          const {timestamp, size, value} = images[pos]

          return (
            <div key={pos}>
              <h3>{title}</h3>
              <img src={value} />
              <div className="flex items-center justify-between">
                <b className="muted">{new Date(timestamp).toLocaleString()}</b>
                <Button startIcon={<DownloadIcon />} size="small" href={value}>{bytesToSizeSI(size)}</Button>
              </div>
            </div>
          )
        })
      }

      {images === null &&
        <span className="muted">No recent images available</span>
      }

      <br/>

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
  display: flex;
  flex-direction: column;
  img {

    max-width: 100%;
    margin: 1px;
  }
`
