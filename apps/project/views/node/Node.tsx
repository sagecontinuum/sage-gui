import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useParams, useLocation, Link} from 'react-router-dom'

import CheckIcon from '@mui/icons-material/CheckCircleRounded'
import Alert from '@mui/material/Alert'

import * as BH from '/components/apis/beehive'
import * as BK from '/components/apis/beekeeper'
import { useProgress } from '/components/progress/ProgressProvider'

import wsnode from 'url:/assets/wsn-closed.png'

import RecentDataTable from '/apps/common/RecentDataTable'
import ManifestTable from '/apps/common/ManifestTable'
import RecentImages from '/apps/common/RecentImages'
import Audio from '/components/viz/Audio

import Hotspot from './Hotspot'


const LeftDataTable = ({node}) =>
  <RecentDataTable
    items={[{
      label: 'Temperature',
      query: {
        node: (node || '').toLowerCase(),
        name: 'env.temperature',
        sensor: 'bme680'
      },
      format: v => `${v}°C`,
      linkParams: (data) => `apps=${data.meta.plugin}&nodes=${data.meta.vsn}&names=${data.name}&sensors=${data.meta.sensor}&window=12h`
    }, {
      label: 'Humidity',
      query: {
        node:  (node || '').toLowerCase(),
        name: 'env.relative_humidity',
        sensor: 'bme680'
      },
      format: v => `${v}`,
      linkParams: (data) => `apps=${data.meta.plugin}&nodes=${data.meta.vsn}&names=${data.name}&sensors=${data.meta.sensor}&window=12h`
    }, {
      label: 'Pressure',
      query: {
        node:  (node || '').toLowerCase(),
        name: 'env.pressure',
        sensor: 'bme680'
      },
      format: v => `${v}`,
      linkParams: (data) => `apps=${data.meta.plugin}&nodes=${data.meta.vsn}&names=${data.name}&sensors=${data.meta.sensor}&window=12h`
    }]}
  />

const RightDataTable = ({node}) =>
  <RecentDataTable
  items={[{
    label: 'Raingauge',
    query: {
      node:  (node || '').toLowerCase(),
      name: 'env.raingauge.event_acc'
    },
    linkParams: (data) => `apps=${data.meta.plugin}&nodes=${data.meta.vsn}&names=${data.name}&window=12h`
  }]}
  />


export default function NodeView() {
  const {node} = useParams()
  const params = new URLSearchParams(useLocation().search)
  const hours = params.get('hours')
  const days = params.get('days')

  const { setLoading } = useProgress()

  const [manifest, setManifest] = useState<BK.Manifest>(null)
  const [vsn, setVsn] = useState(null)
  const [meta, setMeta] = useState(null)


  useEffect(() => {
    setLoading(true)

    BK.getManifest({node: node.toUpperCase()})
      .then(data => {
        setManifest(data)

        // if no manifest, we can not get the vsn for node health
        if (!data) return

        const vsn = data.vsn
        setVsn(vsn)

      })

    BK.getNode(node)
      .then(data => setMeta(data))
      .catch(err => setError(err))
      .finally(() => setLoading(false))

  }, [node, setLoading, days, hours])


  const {
    shield, top_camera, bottom_camera,
    left_camera, right_camera
  } = manifest || {}

  return (
    <Root>
      <h1>Node {vsn} | <small className="muted">{node}</small></h1>

      <ManifestTable manifest={manifest} meta={meta} />

      <div className="flex">
        <div className="flex-grow">
          <h2>Sensor Data</h2>
          <div className="flex data-tables">
            <LeftDataTable node={node} />
            <RightDataTable node={node} />
          </div>

          <h2>Images</h2>
          <RecentImages node={node} horizontal />

          <h2>Audio</h2>
          <Audio node={node} horizontal />
        </div>

        <div>
          <WSNView>
            <img src={wsnode} width={WSN_VIEW_WIDTH} />
            <VSN>{vsn}</VSN>
            {manifest &&
              <>
                {shield                   && <Hotspot top="62%" left="10%" title="ETS ML1-WS" pos="left" />}
                {shield                   && <Hotspot top="40%" left="10%" title="BME680" pos="left"/>}
                {                            <Hotspot top="40%" left="10%" title="BME680" pos="left"/>}
                {top_camera != 'none'     && <Hotspot top="7%"  left="61%" title={top_camera} pos="left" />}
                {bottom_camera != 'none'  && <Hotspot top="87%" left="61%" title={bottom_camera} pos="bottom" />}
                {left_camera != 'none'    && <Hotspot top="49%" left="90%" title={left_camera}/>}
                {right_camera != 'none'   && <Hotspot top="49%" left="8%"  title={right_camera}/>}
              </>
            }
          </WSNView>
        </div>
      </div>
    </Root>
  )
}


const Root = styled.div`
  margin: 20px;

  table.manifest {
    width: 100%;
    margin-bottom: 1em;
  }

  p { margin-bottom: 30px; }

  .data-tables div {
    width: 100%;
    margin-right: 3em
  }
`

const WSN_VIEW_WIDTH = 400

const WSNView = styled.div`
  position: relative;

  img {
    padding: 50px;
  }
`

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


