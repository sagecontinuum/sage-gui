
import { useEffect, useState } from 'react'
import styled from 'styled-components'
import Button from '@mui/material/Button'
import Tooltip from '@material-ui/core/Tooltip'
import DownloadIcon from '@mui/icons-material/CloudDownloadOutlined'
import WarningIcon from '@mui/icons-material/WarningRounded'
import Alert from '@mui/material/Alert'

import {bytesToSizeSI, relTime, isOldData} from '/components/utils/units'
import * as BH from '/components/apis/beehive'



type Props = {
  node: string,
  horizontal?: boolean
}

export default function RecentImages(props: Props) {
  const {node, horizontal} = props

  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<{[pos: string]: BH.OSNRecord}>()
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
    <Root className={horizontal ? 'flex horizontal flex-wrap' : ''}>
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
                className={`hover-${pos}-camera`}
                src={value}
                // style={isOldData(timestamp) ? {border: '10px solid red'} : {}}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div>
                    {isOldData(timestamp) && <WarningIcon className="failed"/>}
                  </div>

                  <Tooltip title={new Date(timestamp).toLocaleString()} placement="top">
                    <b className={isOldData(timestamp) ? 'failed' : 'muted'}>
                      {relTime(timestamp)}
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

      {error &&
        <Alert severity="error">
          {error.message}
        </Alert>
      }
    </Root>
  )
}

const Root = styled.div`
  &.horizontal > div {
    margin-right: 2em;
  }
`
