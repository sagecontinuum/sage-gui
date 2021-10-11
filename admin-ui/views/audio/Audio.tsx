
import React, { useEffect, useState, useRef } from 'react'
import styled from 'styled-components'
import Alert from '@mui/material/Alert'

import WaveSurfer from 'wavesurfer.js'
import SpectrogramPlugin from 'wavesurfer.js/src/plugin/spectrogram'
import colormap from 'colormap'

import Button from '@mui/material/Button'
import PlayIcon from '@mui/icons-material/PlayArrowRounded'
import PauseIcon from '@mui/icons-material/PauseCircleFilledRounded'
import DownloadIcon from '@mui/icons-material/CloudDownloadOutlined'

import {bytesToSizeSI} from '../../../components/utils/units'
import { useProgress } from '../../../components/progress/ProgressProvider'

import * as BH from '../../apis/beehive'


const colors = colormap({
  colormap: 'hot',
  nshades: 256,
  format: 'float'
})


type Props = {
  node: string
}

export default function Audio(props: Props) {
  const {node} = props

  const { setLoading } = useProgress()

  const ref = useRef()
  const ref2 = useRef()

  const [waveSurf, setWaveSurf] = useState()
  const [isPlaying, setIsPlaying] = useState(false)

  const [audio, setAudio] = useState<BH.Record>()
  const [error, setError] = useState()


  useEffect(() => {
    setLoading(true)
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

        setLoading(false)
      }).catch((err) => {
        setError(err)
        setLoading(false)
      })

  }, [node, setLoading])

  return (
    <Root>
      {audio &&
        <div>
          <div  className="flex justify-between">
            <div></div>
            {waveSurf &&
              <div className="flex items-center justify-end gap">
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
