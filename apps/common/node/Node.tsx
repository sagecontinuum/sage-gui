/* eslint-disable max-len */
import { useEffect, useState, useReducer } from 'react'
import styled from 'styled-components'
import { useParams, useLocation } from 'react-router-dom'

import { Alert, Button, Tooltip } from '@mui/material'
import LaunchIcon from '@mui/icons-material/LaunchRounded'

import wsnode from 'url:/assets/wsn-closed.png'

import * as BH from '/components/apis/beehive'
import * as BK from '/components/apis/beekeeper'

import RecentDataTable from '/apps/common/RecentDataTable'
import RecentImages from '/apps/common/RecentImages'
import { useProgress } from '/components/progress/ProgressProvider'
import Audio from '/components/viz/Audio'
import Map from '/components/Map'
import MetaTable from '/components/table/MetaTable'
import Clipboard from '/components/utils/Clipboard'
import format from '/components/data/dataFormatter'
import Timeline from '/components/viz/TimelineChart'
import TimelineSkeleton from '/components/viz/TimelineSkeleton'
import { CardViewStyle, Card } from '/components/layout/Layout'
import Hotspot from './Hotspot'

import adminSettings from '/apps/admin/settings' // todo(nc): organize, maybe?
import config from '/config'


// todo(nc): promote/refactor into component/ lib
import DataOptions from '/apps/sage/data/DataOptions'
import { fetchRollup, parseData } from '/apps/sage/data/rollupUtils'
import { dataReducer, initDataState } from '/apps/sage/data/dataReducer'
import { type Options, colorDensity, stdColor } from '/apps/sage/data/Data'

import { endOfHour, subDays } from 'date-fns'


const ELAPSED_FAIL_THRES = adminSettings.elapsedThresholds.fail

const TIMELINE_MARGIN = {left: 175, right: 20, bottom: 0}
const TIME_WINDOW = 'hour'
const TAIL_DAYS = 45


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
  format: (val) => <a href={`${config.adminURL}/status?project="${encodeURIComponent(val)}"`} target="_blank" rel="noreferrer">{val}</a>
}, {
  id: 'focus',
  format: (val) => <a href={`${config.adminURL}/status?focus="${encodeURIComponent(val)}"`} target="_blank" rel="noreferrer">{val}</a>
}, {
  id: 'location',
  format: (val) => <a href={`${config.adminURL}/status?location="${encodeURIComponent(val)}"`} target="_blank" rel="noreferrer">{val}</a>
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

// todo(nc): temp solution until we have references!
// use the most recent app with same substring, ignoring "plugin-" and version
const findApp = (apps, name) =>
  apps.find(o => o.id.includes(name.replace('plugin-', '')))


export default function NodeView() {
  const {node} = useParams()
  const params = new URLSearchParams(useLocation().search)
  const hours = params.get('hours')
  const days = params.get('days')

  const { loading, setLoading } = useProgress()

  const [manifest, setManifest] = useState<BK.Manifest>(null)
  const [vsn, setVsn] = useState<BK.Manifest['vsn']>(null)
  const [meta, setMeta] = useState<BK.State>(null)
  const [status, setStatus] = useState<string>()
  const [liveGPS, setLiveGPS] = useState<{lat: number, lon: number}>()

  const [error, setError] = useState(null)

  const [hover, setHover] = useState<string>('')

  // todo(nc): refactor into provider?
  const [{data, rawData, error: tlError}, dispatch] = useReducer(
    dataReducer,
    initDataState,
  )

  const [loadingTL, setLoadingTL] = useState(false)

  const [opts, setOpts] = useState<Options>({
    display: 'nodes',
    density: true,
    versions: false,
    time: 'hourly',
    start: subDays(new Date(), TAIL_DAYS)
  })

  // note: endtime is not currently an option
  const [end, setEnd] = useState<Date>(endOfHour(new Date()))


  useEffect(() => {
    BK.getManifest({node: node.toUpperCase()})
      .then(data => {
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


  // data timeline
  useEffect(() => {
    if (!vsn || !manifest) return
    setLoadingTL(true)
    fetchRollup({...opts, vsn})
      .then(data => dispatch({type: 'INIT_DATA', data, manifests: [manifest]}))
      .catch(error => dispatch({type: 'ERROR', error}))
      .finally(() => setLoadingTL(false))
  }, [vsn, manifest])


  const onOver = (id) => {
    const cls = `.hover-${id}`
    const ele = document.querySelector(cls)
    if (!ele) return

    ele.style.outline = '3px solid #1a779c'
    setHover(cls)
  }

  const onOut = (id) => {
    if (!hover) return

    const ele = document.querySelector(hover)
    ele.style.outline = 'none'
  }

  const mouse = {onMouseOver: onOver, onMouseOut: onOut}

  const handleOptionChange = (evt, name) => {
    if (['nodes', 'apps'].includes(name)) {
      setOpts(prev => ({...prev, display: name}))
      return
    } else  if (name == 'time') {
      const time = evt.target.value
      const data = parseData({data: rawData, time})
      dispatch({type: 'SET_DATA', data})
      setOpts(prev => ({...prev, [name]: time}))
      return
    } else if (name == 'versions') {
      const versions = evt.target.checked
      const data = parseData({data: rawData, time: opts.time, versions})
      dispatch({type: 'SET_DATA', data})
      setOpts(prev => ({...prev, [name]: versions}))
      return
    } else if (name == 'density') {
      setOpts(prev => ({...prev, [name]: evt.target.checked}))
    } else {
      throw `unhandled option state change name=${name}`
    }
  }


  const {
    shield, top_camera, bottom_camera,
    left_camera, right_camera
  } = manifest || {}

  return (
    <Root>
      <CardViewStyle />

      {error &&
        <Alert severity="error">{error.message}</Alert>
      }

      <div className="flex">
        <LeftSide className="flex column gap">
          <Card>
            <div className="flex items-center justify-between">
              <h1 className="no-margin">Node {vsn} <small className="muted">{node}</small></h1>

              <Tooltip title={<>Admin page <LaunchIcon style={{fontSize: '1.1em'}}/></>} placement="top">
                <Button href={manifest ? `${config.adminURL}/node/${manifest.node_id}` : ''} target="_blank">
                  <span className={`${status == 'reporting' ? 'success font-bold' : 'failed font-bold'}`}>
                    {status}
                  </span>
                </Button>
              </Tooltip>
            </div>
          </Card>

          <div className="flex items-start meta-tables gap">
            <Card noPad className="meta-left">
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
            </Card>

            <Card noPad className="meta-right">
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
            </Card>
          </div>

          <Card>
            <div className="timeline-title flex items-center">
              <h2>Last {TAIL_DAYS} days of data</h2>
              {Object.keys(data || {}).length > 0 &&
              <DataOptions onChange={handleOptionChange} opts={opts} condensed />
              }
            </div>

            {loadingTL && !tlError &&
              <div className="clearfix w-full">
                <TimelineSkeleton />
              </div>
            }

            {!Object.keys(data || {}).length &&
              <div className="clearfix muted">No data available</div>
            }

            {Object.keys(data || {}).length > 0 && vsn &&
            <Timeline
              data={data[vsn]}
              cellUnit={opts.time == 'daily' ? 'day' : 'hour'}
              colorCell={opts.density ? colorDensity : stdColor}
              startTime={opts.start}
              endTime={end}
              tooltip={(item) => `
                <div style="margin-bottom: 5px;">
                  ${new Date(item.timestamp).toDateString()} ${new Date(item.timestamp).toLocaleTimeString([], {timeStyle: 'short'})} (${TIME_WINDOW})
                </div>
                ${item.meta.plugin}<br>
                ${item.value.toLocaleString()} records`
              }
              onRowClick={(name) => {
                const app = findApp(ecr, name)
                navigate(`/apps/app/${app.id.split(':')[0]}`)
              }}
              onCellClick={(data) => {
                const {timestamp, meta} = data
                const {vsn, plugin} = meta
                const win = opts.time == 'daily' ? 'd' : 'h'
                window.open(`${window.location.origin}/query-browser?nodes=${vsn}&apps=${plugin}.*&start=${timestamp}&window=${win}`, '_blank')
              }}
              margin={TIMELINE_MARGIN}
            />
            }
          </Card>

          <Card>
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
          </Card>

          <Card>
            <h2>Images</h2>
            <Imgs>
              <RecentImages node={node} horizontal />
            </Imgs>
          </Card>

          <Card>
            <h2>Audio</h2>
            <Audio node={node} className="hover-audio"/>
          </Card>
        </LeftSide>

        <RightSide className="justify-end">
          <Card noPad>
            {hasStaticGPS(manifest) && status && vsn &&
              <Map
                data={[{
                  id: vsn,
                  vsn,
                  lat: manifest.gps_lat,
                  lng: manifest.gps_lon,
                  status,
                  ...manifest
                }]} />
            }
            {!hasStaticGPS(manifest) && liveGPS && status &&
              <Map data={[{
                id: vsn,
                vsn,
                lat: liveGPS.lat,
                lng: liveGPS.lon,
                status,
                ...manifest
              }]} />
            }
            {!hasStaticGPS(manifest) && !liveGPS && !loading &&
              <div className="muted" style={{margin: 18}}>(Map not available)</div>
            }
          </Card>

          {vsn?.charAt(0) == 'W' &&
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
          }
        </RightSide>
      </div>
    </Root>
  )
}


const Root = styled.div`
  h2 {
    margin-top: 0;
  }

  .meta-left {
    flex: 1;
    height: 100%;
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

  .timeline-title {
    float: left;
    h2 { margin-right: 1em; }
  }
`

const Imgs = styled.div`
  img {
    max-width: 380px;
    object-fit: contain;
  }
`

const LeftSide = styled.div`
  margin: 20px;
  flex: 2 1 auto;
`

const RightSide = styled.div`
  margin: 20px 20px 20px 15px;
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

