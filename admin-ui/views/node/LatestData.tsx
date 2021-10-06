
import React, { useEffect, useState, useRef } from 'react'
import styled from 'styled-components'
import Alert from '@material-ui/lab/Alert'

import * as BH from '../../apis/beehive'

import WaveSurfer from 'wavesurfer.js'
import SpectrogramPlugin from 'wavesurfer.js/src/plugin/spectrogram'
import colormap from 'colormap'

import Button from '@material-ui/core/Button'
import PlayIcon from '@material-ui/icons/PlayArrowRounded'
import PauseIcon from '@material-ui/icons/PauseCircleFilledRounded'
import DownloadIcon from '@material-ui/icons/CloudDownloadOutlined'

import {bytesToSizeSI} from '../../../components/utils/units'


const colors = colormap({
  colormap: 'hot',
  nshades: 256,
  format: 'float'
})


type Props = {
  node: string
}

export default function LatestData(props: Props) {
  const {node} = props


  const ref = useRef()
  const ref2 = useRef()

  const [waveSurf, setWaveSurf] = useState()
  const [isPlaying, setIsPlaying] = useState(false)


  const [images, setImages] = useState<{[pos: string]: BH.Record}>()
  const [audio, setAudio] = useState<BH.Record>()
  const [error, setError] = useState()


  useEffect(() => {

    BH.getLatestImages(node.toLowerCase())
      .then(images => {
        const hasData = !!Object.keys(images).filter(k => images[k]).length

        setImages(hasData ? images : null)
      }).catch((err) => {
        setError(err)
      })

    BH.getLatestAudio(node.toLowerCase())
      .then(data => {
        setAudio(data)

        if (!data) return

        var wavesurfer = WaveSurfer.create({
          container: ref.current,
          waveColor: 'violet',
          progressColor: 'purple',
          plugins: [
            SpectrogramPlugin.create({
              container: ref2.current,
              labels: true,
              colorMap: colors
            })
          ]
        })


        wavesurfer.on('ready', function () {
          // wavesurfer.play()
          setWaveSurf(wavesurfer)
        })


        wavesurfer.on('play', function () {
          setIsPlaying(true)
        })

        wavesurfer.on('pause', function () {
          setIsPlaying(false)
        })

        wavesurfer.load(data.value)

      }).catch((err) => {
        setError(err)
      })

  }, [])

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

      {audio &&
        <div>
          <div  className="flex justify-between">
            <h2>
            Audio
            </h2>

            {waveSurf &&
              <div className="flex items-center gap">
                {!isPlaying &&
                <Button startIcon={<PlayIcon />} onClick={() => {waveSurf.play(); }} variant="outlined" size="small">
                  play
                </Button>
                }
                {isPlaying &&
                <Button startIcon={<PauseIcon />} onClick={() => {waveSurf.pause(); }} variant="outlined" size="small">
                  pause
                </Button>
                }
              </div>
            }
          </div>

          <div ref={ref}></div>
          <div ref={ref2}></div>
          <div className="flex items-center justify-between">
            <b className="muted">{new Date(audio.timestamp).toLocaleString()}</b>
            <Button startIcon={<DownloadIcon />} size="small" href={audio.value}>{bytesToSizeSI(audio.size)}</Button>
          </div>
        </div>
      }

      {audio === null &&
        <div>
          <h2>Audio</h2>
          <span className="muted">No audio available</span>
        </div>
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
  display: flex;
  flex-direction: column;
  img {

    max-width: 100%;
    margin: 1px;
  }
`
