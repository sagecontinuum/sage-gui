
import React, { useEffect, useState, useRef } from 'react'
import styled from 'styled-components'
import Alert from '@mui/material/Alert'

import WaveSurfer from 'wavesurfer.js'
import SpectrogramPlugin from 'wavesurfer.js/src/plugin/spectrogram'
import colormap from 'colormap'

import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import PlayIcon from '@mui/icons-material/PlayArrowRounded'
import PauseIcon from '@mui/icons-material/PauseCircleFilledRounded'
import DownloadIcon from '@mui/icons-material/CloudDownloadOutlined'
import WarningIcon from '@mui/icons-material/WarningRounded'

import {bytesToSizeSI, msToTime} from '../../../components/utils/units'
import { useProgress } from '../../../components/progress/ProgressProvider'

import * as BH from '../../apis/beehive'

import { isOldData } from '../node/RecentData'

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
    <Root className="flex column">
      {audio &&
        <div style={isOldData(audio.timestamp) ? {border: '10px solid red'} : {}}>
          <div  className="flex justify-between">
            <div></div>
            {waveSurf &&
              <div className="flex items-center justify-end gap">
                {!isPlaying &&
                <Button startIcon={<PlayIcon />} onClick={() => {waveSurf.play() }} variant="outlined" size="small">
                  play
                </Button>
                }
                {isPlaying &&
                <Button startIcon={<PauseIcon />} onClick={() => {waveSurf.pause() }} variant="outlined" size="small">
                  pause
                </Button>
                }
              </div>
            }
          </div>

          <div ref={ref}></div>
          <div ref={ref2}></div>
          <div
            className="flex items-center justify-between"
          >
            <div className="flex items-center">
              <div>
                {isOldData(audio.timestamp) && <WarningIcon className="failed"/>}
              </div>

              <Tooltip title={new Date(audio.timestamp).toLocaleString()} placement="top">
                <b className={isOldData(audio.timestamp) ? 'failed' : 'muted'}>
                  ~{msToTime(new Date().getTime() - new Date(audio.timestamp).getTime())}
                </b>
              </Tooltip>
            </div>

            <Button startIcon={<DownloadIcon />} size="small" href={audio.value}>{bytesToSizeSI(audio.size)}</Button>
          </div>
        </div>
      }

      {audio === null &&
        <p className="muted">No recent audio available</p>
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
`
