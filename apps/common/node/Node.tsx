import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useParams, useLocation } from 'react-router-dom'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import LaunchIcon from '@mui/icons-material/LaunchRounded'

import wsnode from 'url:/assets/wsn-closed.png'

import * as BH from '/components/apis/beehive'
import * as BK from '/components/apis/beekeeper'
import { useProgress } from '/components/progress/ProgressProvider'

import RecentDataTable from '/apps/common/RecentDataTable'
import RecentImages from '/apps/common/RecentImages'
import Audio from '/components/viz/Audio'
import Map from '/components/LeafletMap'
import MetaTable from '/components/utils/MetaTable'
import Hotspot from './Hotspot'

import adminSettings from '/apps/admin/settings' // todo(nc): organize
import config from '/config'
import Clipboard from '/components/utils/Clipboard'
import format from '/components/data/dataFormatter'

const ELAPSED_FAIL_THRES = adminSettings.elapsedThresholds.fail

// todo(nc): remove hardcoded additional sensors
import {hasMetOne} from '/config'


const hasStaticGPS = manifest =>
  manifest && manifest.gps_lat && manifest.gps_lat

const noneFormatter = (val) =>
  typeof val == 'boolean' ?
    (val ? 'yes' : 'no') :
    ((!val || val == 'none' || '') ? '-' : val)


const metaRows1 = [{
  id: 'project',
  format: (val) => <a href={`${config.adminURL}/status?project="${encodeURIComponent(val)}"`} target="_blank">{val}</a>
}, {
  id: 'focus',
  format: (val) => <a href={`${config.adminURL}/status?focus="${encodeURIComponent(val)}"`} target="_blank">{val}</a>
}, {
  id: 'location',
  format: (val) => <a href={`${config.adminURL}/status?location="${encodeURIComponent(val)}"`} target="_blank">{val}</a>
}, {
  id: 'build_date',
  label: 'Built'
}, {
  id: 'commission_date',
  label: 'Commissioned'
}, {
  id: 'registration_event',
  label: 'Registration',
  format: (val) => new Date(val).toLocaleString()
}]

const metaRows2 = [
  {id: 'shield', format: noneFormatter},
  {id: 'modem', format: noneFormatter},
  {id: 'modem_sim', format: noneFormatter},
  {id: 'nx_agent', format: noneFormatter}
]

const cameraMetaRows = [
  {id: 'top_camera', label: 'Top', format: noneFormatter},
  {id: 'bottom_camera',  label: 'Bottom', format: noneFormatter},
  {id: 'left_camera', label: 'Left', format: noneFormatter},
  {id: 'right_camera', label: 'Right', format: noneFormatter}
]

export default function NodeView() {
  const {node} = useParams()
  const params = new URLSearchParams(useLocation().search)
  const hours = params.get('hours')
  const days = params.get('days')

  const { setLoading } = useProgress()

  const [manifest, setManifest] = useState<BK.Manifest>(null)
  const [vsn, setVsn] = useState<string>(null)
  const [meta, setMeta] = useState<BK.State>(null)
  const [status, setStatus] = useState<string>()
  const [liveGPS, setLiveGPS] = useState<{lat: Number, lon: Number}>()

  const [error, setError] = useState(null)

  const [hover, setHover] = useState<string>('')

  useEffect(() => {
    BK.getManifest({node: node.toUpperCase()})
      .then(data => {noneFormatter
        setManifest(data)

        // if no manifest, we can not get the vsn for node health
        if (!data) return

        const vsn = data.vsn
        setVsn(vsn)

        BH.getSimpleNodeStatus(vsn)
          .then((records) => {
            const elapsed = records.map(o => new Date().getTime() - new Date(o.timestamp).getTime())
            const isReporting = elapsed.some(val => val < ELAPSED_FAIL_THRES)
            setStatus(isReporting ? 'reporting' : 'not reporting')
          })
        BH.getGPS(vsn)
          .then(d => setLiveGPS(d))
      })

    BK.getNode(node)
      .then(data => setMeta(data))
      .catch(err => setError(err))
  }, [node, setLoading, days, hours])


  const onOver = (id) => {
    const cls = `.hover-${id}`
    document.querySelector(cls).style.outline = '3px solid #1a779c'
    setHover(cls)
  }

  const onOut = (id) => {
    document.querySelector(hover).style.outline = 'none'
  }

  const mouse = {onMouseOver: onOver, onMouseOut: onOut}

  const {
    shield, top_camera, bottom_camera,
    left_camera, right_camera
  } = manifest || {}

  return (
    <Root>

      {error &&
        <Alert severity="error">{error.message}</Alert>
      }

      <div className="flex">
        <LeftSide>
          <div className="flex items-center justify-between">
            <h1>Node {vsn} | <small className="muted">{node}</small></h1>
            <Tooltip title={<>Admin page <LaunchIcon style={{fontSize: '1.1em'}}/></>} placement="top">
              <Button href={manifest ? `${config.adminURL}/node/${manifest.node_id}` : ''} target="_blank">
                <span className={`flex items-center status ${status == 'reporting' ? 'success font-bold' : 'failed font-bold'}`}>
                  {status}
                </span>
              </Button>
            </Tooltip>
          </div>
          <div className="flex items-start meta-tables">
            <div className="meta-left">
              <MetaTable
                title="Overview"
                rows={[
                  ...metaRows1,
                  {
                    id: 'gps',
                    label: <> GPS ({hasStaticGPS(manifest) ? 'static' : 'from stream'})</>,
                    format: () =>
                      <div className="gps">
                        {hasStaticGPS(manifest) &&
                          <Clipboard content={`${manifest.gps_lat},\n${manifest.gps_lon}`} />
                        }
                        {!hasStaticGPS(manifest) && liveGPS &&
                          <Clipboard content={`${liveGPS.lat},\n${liveGPS.lon}`} />
                        }
                        {!hasStaticGPS(manifest) && !liveGPS &&
                          <span className="muted">not available</span>
                        }
                      </div>
                  }
                ]}
                data={{...manifest, ...meta}}
              />
            </div>
            <div className="meta-right">
              <MetaTable
                title="Hardware"
                rows={metaRows2}
                data={{...manifest, ...meta}}
              />

              <MetaTable
                title="Cameras"
                rows={cameraMetaRows}
                data={{...manifest, ...meta}}
              />
            </div>
          </div>

          <h2>Sensors</h2>
          {vsn &&
            <div className="flex data-tables">
              <RecentDataTable
                items={format(['temp', 'humidity', 'pressure'], vsn)}
                className="hover-bme"
              />

              <div>
                <RecentDataTable
                  items={format(['raingauge'], vsn)}
                  className="hover-rain"
                />
                {hasMetOne(vsn) &&
                  <RecentDataTable
                    items={format(['es642AirQuality'], vsn)}
                  />
                }
              </div>
            </div>
          }

          <h2>Images</h2>
          <Imgs>
            <RecentImages node={node} horizontal />
          </Imgs>

          <h2>Audio</h2>
          <Audio node={node} className="hover-audio"/>
        </LeftSide>

        <RightSide className="justify-end">
          {hasStaticGPS(manifest) &&
            <Map data={{lat: manifest.gps_lat, lon: manifest.gps_lon}} />
          }
          {!hasStaticGPS(manifest) && liveGPS &&
            <Map data={liveGPS} />
          }
          <WSNView>
            <img src={wsnode} width={WSN_VIEW_WIDTH} />
            <VSN>{vsn}</VSN>
            {manifest &&
              <>
                {shield                   && <Hotspot top="62%" left="10%" label="ML1-WS" title="Microphone" pos="left" {...mouse} hoverid="audio" />}
                {shield                   && <Hotspot top="40%" left="10%" label="BME680" title="Temp, humidity, pressure, and gas sesnor" pos="left" {...mouse} hoverid="bme" />}
                {                            <Hotspot top="15%" left="68%" label="RG-15" title="Raingauge" pos="right" {...mouse} hoverid="rain" />}
                {top_camera != 'none'     && <Hotspot top="7%"  left="61%" label={top_camera} title="Top camera" pos="left" {...mouse} hoverid="top-camera" />}
                {bottom_camera != 'none'  && <Hotspot top="87%" left="61%" label={bottom_camera} title="Bottom camera" pos="bottom" {...mouse} hoverid="bottom-camera" />}
                {left_camera != 'none'    && <Hotspot top="49%" left="90%" label={left_camera} title="Left camera" {...mouse} hoverid="left-camera" />}
                {right_camera != 'none'   && <Hotspot top="49%" left="8%"  label={right_camera} title="Right camera" {...mouse} hoverid="right-camera" />}
              </>
            }
          </WSNView>
        </RightSide>
      </div>
    </Root>
  )
}


const Root = styled.div`
  .meta-tables {
    table {

    }
  }

  .meta-left {
    flex: 1;
    margin-right: 2em;
  }

  .meta-right {
    flex: 1;
  }

  .data-tables div {
    width: 100%;
    margin-right: 3em
  }

  .gps {
    width: 150px;
    margin-bottom: 1em;
    .clipboard-content {
      // less padding since scroll not needed
      padding-bottom: 8px;
    }
  }
`

const Imgs = styled.div`
  img {
    height: 300px;
    width: auto;
  }
`

const LeftSide = styled.div`
  margin: 20px;
  flex: 2 1 auto;
`

const RightSide = styled.div`
  margin: 20px;
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

