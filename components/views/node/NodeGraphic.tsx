/* eslint-disable max-len */
import { useState } from 'react'
import styled from 'styled-components'
import wsnode from 'url:/assets/wsn-closed.png'
import Hotspot from './Hotspot'

import { type Node } from '/components/apis/beekeeper'

type Props = {
  node: Node
  shield: boolean
}

export default function WildSageNode(props: Props) {
  const {node, shield} = props
  const { vsn, type, top_camera, bottom_camera, left_camera, right_camera } = node || {}

  const [hover, setHover] = useState<string>('')

  const onOver = (id) => {
    const cls = `.hover-${id}`
    const ele: HTMLElement = document.querySelector(cls)
    if (!ele) return

    ele.style.outline = '3px solid #1a779c'
    setHover(cls)
  }

  const onOut = () => {
    if (!hover) return

    const ele: HTMLElement = document.querySelector(hover)
    ele.style.outline = 'none'
  }

  const mouse = {onMouseOver: onOver, onMouseOut: onOut}

  return (
    <>
      {type == 'WSN' ?
        <WSNView>
          <img src={wsnode} width={WSN_VIEW_WIDTH} />
          <VSN>{vsn}</VSN>
          {node &&
            <>
              {shield         && <Hotspot top="62%" left="10%" label="ML1-WS" title="Microphone" pos="left" {...mouse} hoverid="audio" />}
              {shield         && <Hotspot top="40%" left="10%" label="BME680" title="Temp, humidity, pressure, and gas sesnor" pos="left" {...mouse} hoverid="BME680" />}
              {                  <Hotspot top="15%" left="68%" label="RG-15" title="Raingauge" pos="right" {...mouse} hoverid="RG-15" />}
              {top_camera     && <Hotspot top="7%"  left="61%" label={top_camera} title="Top camera" pos="left" {...mouse} hoverid="top-camera" />}
              {bottom_camera  && <Hotspot top="87%" left="61%" label={bottom_camera} title="Bottom camera" pos="bottom" {...mouse} hoverid="bottom-camera" />}
              {left_camera    && <Hotspot top="49%" left="90%" label={left_camera} title="Left camera" {...mouse} hoverid="left-camera" />}
              {right_camera   && <Hotspot top="49%" left="8%"  label={right_camera} title="Right camera" {...mouse} hoverid="right-camera" />}
            </>
          }
        </WSNView>
        :
        <div style={{width: WSN_VIEW_WIDTH}} />
      }
    </>
  )
}


const VSN = styled.div`
  position: absolute;
  width: 33%;
  height: 12%;
  top: 51%;
  left: 48%;
  font-size: 3.5em;
  padding: 0;
  background: #b3b3b3;
`

const WSN_VIEW_WIDTH = 400

const WSNView = styled.div`
  position: sticky;
  top: 60px;

  img {
    padding: 50px;
    -webkit-filter: drop-shadow(2px 2px 2px #ccc);
    filter: drop-shadow(2px 2px 2px #ccc);
  }
`
