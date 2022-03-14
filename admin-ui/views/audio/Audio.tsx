
import { useEffect, useState, useRef } from 'react'
import styled from 'styled-components'
import Alert from '@mui/material/Alert'

import WaveSurfer from 'wavesurfer.js'
import SpectrogramPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.spectrogram'
import colormap from 'colormap'

import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import PlayIcon from '@mui/icons-material/PlayArrowRounded'
import PauseIcon from '@mui/icons-material/PauseCircleFilledRounded'
import DownloadIcon from '@mui/icons-material/CloudDownloadOutlined'
import WarningIcon from '@mui/icons-material/WarningRounded'

import {bytesToSizeSI, msToTime} from '~/components/utils/units'
import { useProgress } from '~/components/progress/ProgressProvider'

import * as BH from '~/components/apis/beehive'

import { isOldData } from '../node/RecentData'


const colors = colormap({
  colormap: 'hot',
  nshades: 256,
  format: 'float'
})


type Props = {
  node?: string
  dataURL?: string
}

export default function Audio(props: Props) {
  const {node, dataURL} = props

  const { setLoading } = useProgress()

  const audioRef = useRef()
  const spectroGramRef = useRef()

  const [waveSurf, setWaveSurf] = useState()
  const [isPlaying, setIsPlaying] = useState(false)

  const [meta, setMeta] = useState<BH.OSNRecord>()

  // error for meta requests
  const [error, setError] = useState()

  // wavesurfer error
  const [vizError, setVizError] = useState()


  useEffect(() => {
    setLoading(true)

    // if node id is provided, fetch meta from beehive first
    if (node) {
      BH.getLatestAudio(node.toLowerCase())
        .then(meta => {
          setMeta(meta)

          // if we can't find meta, don't load wavesurfer
          if (!meta) return

          const url = meta.value
          loadPlayer(url)
        })
        .catch((err) => setError(err))
        .finally(() => setLoading(false))

    } else if (dataURL) {
      // if OSN url is provided, don't get meta
      loadPlayer(dataURL)
      setLoading(false)
    } else {
      throw 'Audio: no node or url provided'
    }
  }, [node, dataURL, setLoading])


  function loadPlayer(url) {
    var wavesurfer = WaveSurfer.create({
      container: audioRef.current,
      waveColor: 'violet',
      progressColor: 'purple',
      plugins: [
        SpectrogramPlugin.create({
          container: spectroGramRef.current,
          labels: true,
          colorMap: colors
        })
      ]
    })

    wavesurfer.on('ready', () => setWaveSurf(wavesurfer))
    wavesurfer.on('play', () => setIsPlaying(true))
    wavesurfer.on('pause', () => setIsPlaying(false))

    wavesurfer.load(url)
    wavesurfer.on('error', (err) => setVizError(err))
  }

  return (
    <Root className="flex column">
      {/* fallback to html audio element (if CORS is not configured) */}
      {(vizError || meta?.value || dataURL) &&
        <HtmlAudio>
          <audio
            ref={audioRef}
            controls
            src={meta?.value || dataURL}
          >
            Your browser does not support the <code>audio</code> element.
          </audio>
        </HtmlAudio>
      }


      <div style={(meta && isOldData(meta.timestamp)) ? {border: '10px solid red'} : {}}>
        <div  className="flex justify-between">
          <div></div>
          {waveSurf &&
            <div className="flex items-center justify-end gap">
              {!isPlaying &&
              <Button
                startIcon={<PlayIcon />}
                onClick={() => {waveSurf.play() }}
                variant="outlined"
              >
                play
              </Button>
              }
              {isPlaying &&
              <Button
                startIcon={<PauseIcon />}
                onClick={() => {waveSurf.pause() }}
                variant="outlined"
              >
                pause
              </Button>
              }
            </div>
          }
        </div>

        {!vizError &&
          <div>
            <div ref={audioRef}></div>
            <div ref={spectroGramRef}></div>
          </div>
        }

        {!dataURL && meta &&
          <div
            className="flex items-center justify-between"
          >
            <div className="flex items-center">
              <div>
                {isOldData(meta.timestamp) && <WarningIcon className="failed"/>}
              </div>

              <Tooltip title={new Date(meta.timestamp).toLocaleString()} placement="top">
                <b className={isOldData(meta.timestamp) ? 'failed' : 'muted'}>
                  ~{msToTime(new Date().getTime() - new Date(meta.timestamp).getTime())}
                </b>
              </Tooltip>
            </div>

            <Button
              startIcon={<DownloadIcon />}
              href={meta.value}
            >
              {bytesToSizeSI(meta.size)}
            </Button>
          </div>
        }
      </div>

      {meta === null &&
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

const HtmlAudio = styled.div`
  audio {
    width: 100%;
  }
`
