
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import DownloadIcon from '@mui/icons-material/CloudDownloadOutlined'
import WarningIcon from '@mui/icons-material/WarningRounded'
import Alert from '@mui/material/Alert'

import { bytesToSizeSI, relativeTime, isOldData } from '/components/utils/units'
import * as BH from '/components/apis/beehive'
import { type VSN } from '/components/apis/beekeeper'


type Props = {
  vsn: VSN,
  cameras: string[]
  horizontal?: boolean
}

export default function RecentImages(props: Props) {
  const {vsn, cameras, horizontal} = props

  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<{[name: string]: BH.OSNRecord}>()
  const [error, setError] = useState<{message: string}>()

  const [total, setTotal] = useState<{[name: string]: number}>()
  const [progress, setProgress] = useState<{[name: string]: number}>()

  useEffect(() => {
    setLoading(true)
    BH.getRecentImagesV2(vsn, cameras, onStart, onProgress)
      .then(images => {
        const hasData = !!Object.keys(images).filter(k => images[k]).length
        setImages(hasData ? images : null)
      }).catch((err) => {
        setError(err)
      }).finally(() => setLoading(false))
  }, [vsn, cameras])


  const onStart = (name, total) => {
    setTotal(prev => ({...prev, [name]: total}))
  }

  const onProgress = (name, count) => {
    setProgress(prev => ({...prev, [name]: count}))
  }


  return (
    <Root className={horizontal ? 'flex horizontal flex-wrap' : ''}>
      {images &&
        cameras.map(name => {
          // const title = `${name.charAt(0).toUpperCase()}${name.slice(1)}`
          if (!images[name])
            return (
              <div key={name}>
                <h3>{name}</h3>
              </div>
            )

          const {timestamp, size, value, meta} = images[name]
          const {task} = meta

          return (
            <div key={name}>
              <h3>{name}</h3>
              <img
                className={`hover-${name}-camera`}
                src={value}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap">
                  <div className="flex items-center">
                    {isOldData(timestamp)  &&
                      <div><WarningIcon className="failed"/></div>
                    }
                    <Tooltip title={new Date(timestamp).toLocaleString()} placement="top">
                      <b className={isOldData(timestamp) ? 'failed' : 'muted'}>
                        {relativeTime(timestamp)}
                      </b>
                    </Tooltip>
                  </div>

                  <Button
                    component={Link}
                    to={`/query-browser?type=images&tasks=${task}&start=-12h&mimeType=image&page=0&nodes=${vsn}`}
                  >
                    View more...
                  </Button>
                </div>
                <Button startIcon={<DownloadIcon />} href={value}>
                  {bytesToSizeSI(size)}
                </Button>
              </div>
            </div>
          )
        })
      }

      {loading && total && progress &&
        cameras.map(name => {
          return total[name] > 0 && total[name] != progress[name] &&
            <div key={name}><b>{name}</b>: Searching {progress[name]} of {total[name]}</div>
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
