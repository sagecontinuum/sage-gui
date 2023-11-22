/* eslint-disable max-len */
import { useEffect, useState, useReducer } from 'react'
import styled from 'styled-components'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { Alert, Button, Tooltip } from '@mui/material'
import LaunchIcon from '@mui/icons-material/LaunchRounded'
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined'
import Grid from '@mui/material/Unstable_Grid2'

import wsnode from 'url:/assets/wsn-closed.png'

import * as BH from '/components/apis/beehive'
import * as BK from '/components/apis/beekeeper'
import * as ECR from '/components/apis/ecr'

import { useProgress } from '/components/progress/ProgressProvider'
import { CardViewStyle, Card } from '/components/layout/Layout'
import NodeNotFound from './NodeNotFound'
import Audio from '/components/viz/Audio'
import Map from '/components/Map'
import MetaTable from '/components/table/MetaTable'
import Clipboard from '/components/utils/Clipboard'
import format from '/components/data/dataFormatter'
import Timeline from '/components/viz/Timeline'
import TimelineSkeleton from '/components/viz/TimelineSkeleton'
import AppLabel from '/components/viz/TimelineAppLabel'
import Table from '/components/table/Table'
import Portal from '/components/PortalLink'

import RecentDataTable from '../RecentDataTable'
import RecentImages from '../RecentImages'
import Hotspot from './Hotspot'
import ManifestTabs from './ManifestTabs'

import AdminNodeHealth from './AdminNodeHealth'
import adminSettings from '/apps/admin/settings'
import config from '/config'

// import lorawan components
import lorawandeviceCols from './lorawandevice/columns'

// todo(nc): promote/refactor into component lib
import DataOptions from '/components/input/DataOptions'
import { fetchRollup, parseData } from '/apps/sage/data/rollupUtils'
import { dataReducer, initDataState } from '/apps/sage/data/dataReducer'
import { type Options, colorDensity, stdColor } from '/apps/sage/data/Data'

import { endOfHour, subDays, subYears, addHours, addDays } from 'date-fns'

import { LABEL_WIDTH as ADMIN_TL_LABEL_WIDTH } from './AdminNodeHealth'


const ELAPSED_FAIL_THRES = adminSettings.elapsedThresholds.fail

const TL_LABEL_WIDTH = 175 // default timeline label width
const TAIL_DAYS = '-7d'



const hasStaticGPS = (meta: BK.FlattenedManifest) : boolean =>
  !!meta?.gps_lat && !!meta?.gps_lat


const hasMetOne = (meta: BK.FlattenedManifest) : boolean =>
  meta?.sensors.some(({hw_model}) => hw_model.match(/ES-642/gi))


const getStartTime = (str) =>
  str.includes('y') ?
    subYears(new Date(), str.replace(/-|y/g, '')) :
    subDays(new Date(), str.replace(/-|d/g, ''))


const metaRows1 = [{
  id: 'project',
  format: (val) => <a href={`/nodes?project="${encodeURIComponent(val)}"`} target="_blank" rel="noreferrer">{val}</a>
}, {
  id: 'focus',
  format: (val) => <a href={`/nodes?focus="${encodeURIComponent(val)}"`} target="_blank" rel="noreferrer">{val}</a>
}, {
  id: 'location',
  format: (val) => <a href={`/nodes?city="${encodeURIComponent(val)}"`} target="_blank" rel="noreferrer">{val}</a>
}, {
  id: 'build_date',
  label: 'Built'
}, {
  id: 'commission_date',
  label: 'Commissioned'
}, {
  id: 'registration_event',
  label: 'Registration',
  format: (val) => val ? new Date(val).toLocaleString() : '-'
}]


const sensorOverview = [{
  id: 'cameras',
  format: (val, obj) => {
    const cameras = obj.sensors
      .filter(o => o.name.match(/camera/gi))

    return (
      <Grid container>
        {cameras.map((o, i) =>
          <Grid xs={3} key={i}>
            <small className="muted font-bold">
              {o.name.replace(/-|_/, ' ')}
            </small>
            <div>
              <Portal to={`/sensors/${o.hw_model}`}>{o.hw_model}</Portal>
            </div>
          </Grid>
        )}
      </Grid>
    )
  }
}, {
  id: 'sensors',
  label: 'Sensors',
  format: (val, obj) => {
    const sensors = obj.sensors
      .filter(o => !o.name.match(/camera/gi))

    return (
      <Grid container>
        {sensors.map((o, i) =>
          <Grid xs={3} key={i}>
            <small className="muted font-bold">
              {o.name.replace(/-|_/, ' ')}
            </small>
            <div>
              <Portal to={`/sensors/${o.hw_model}`}>{o.hw_model}</Portal>
            </div>
          </Grid>
        )}
      </Grid>
    )
  }
}]

const computeOverview = [{
  id: 'computes',
  format: (val, obj) => {
    const {computes} = obj

    return (
      <Grid container>
        {computes.map((o, i) =>
          <Grid xs={3} key={i}>
            <small className="muted font-bold">
              {o.name.split(/-|_/)[0]}
            </small>
            <div>
              {o.hw_model}
            </div>
          </Grid>
        )}
      </Grid>
    )
  },
}]



const hardwareMeta = [{
  id: 'all',
  format: (val, obj) => {
    const {modem, computes} = obj

    return (
      <Grid container>
        <Grid xs={3}>
          <small className="muted font-bold">Shield</small>
          <div>{computes.some(o => o.zone == 'shield') ? 'yes' : 'no'}</div>
        </Grid>

        <Grid xs={3}>
          <small className="muted font-bold">NX Agent</small>
          <div>{computes.some(o => o.name == 'nxagent') ? <Link to="?tab=computes" replace>yes</Link> : 'no'}</div>
        </Grid>

        <Grid xs={3}>
          <small className="muted font-bold">Modem</small>
          <div>{modem ? <Link to="?tab=peripherals" replace>{modem.model}</Link> : 'no'}</div>
        </Grid>

        <Grid xs={3}>
          <small className="muted font-bold">Modem Sim</small>
          <div>{obj.resources.some(o => o.name == 'modem-sim') ?
            <Link to="?tab=peripherals" replace>{obj.resources.find(o => o.name == 'modem-sim').hardware}</Link> : 'no'}</div>
        </Grid>
      </Grid>
    )
  }
}]

/**
 * column config for sensor/compute/peripherals table details
 */
const sensorCols = [{
  id: 'name',
  label: 'Name'
}, {
  id: 'hw_model',
  label: 'Model',
  format: (val) =>
    <Link to={`/sensors/${val}`}>
      {val}
    </Link>
}, {
  id: 'manufacturer',
  label: 'Manufacturer'
}, {
  id: 'datasheet',
  label: 'Datasheet',
  format: (val) => val ? <a href={val} target="_blank" rel="noreferrer"><DescriptionIcon/></a> : '-'
}]


const computeCols = [{
  id: 'name',
  label: 'Name'
}, {
  id: 'hw_model',
  label: 'Model'
}, {
  id: 'manufacturer',
  label: 'Manufacturer'
}, /* {
  id: 'serial_no',
  label: 'Serial No.'
}*/ {
  id: 'datasheet',
  label: 'Datasheet',
  format: (val) => val ? <a href={val} target="_blank" rel="noreferrer"><DescriptionIcon/></a> : '-'
}]


const resourceCols = [{
  id: 'name',
  label: 'Name'
}, {
  id: 'hw_model',
  label: 'Model'
}, {
  id: 'manufacturer',
  label: 'Manufacturer'
}, {
  id: 'datasheet',
  label: 'Datasheet',
  format: (val) => val ? <a href={val} target="_blank" rel="noreferrer"><DescriptionIcon/></a> : '-'
}]

type Props = {
  admin?: boolean
}

export default function NodeView(props: Props) {
  const {admin} = props
  const vsn = useParams().vsn as BK.VSN

  const [params] = useSearchParams()
  const tab = params.get('tab') || 'overview'


  const { loading, setLoading } = useProgress()

  const [nodeID, setNodeID] = useState<BK.NodeMeta['node_id']>(null)

  const [nodeMeta, setNodeMeta] = useState<BK.NodeMeta>()
  const [manifest, setManifest] = useState<BK.FlattenedManifest>()
  const [bkMeta, setBKMeta] = useState<BK.BKState>()

  const [status, setStatus] = useState<string>()
  const [liveGPS, setLiveGPS] = useState<BH.GPS>()
  const [ecr, setECR] = useState<ECR.AppDetails[]>()

  const [error, setError] = useState(null)
  const [vsnNotFound, setVsnNotFound] = useState(null)

  const [hover, setHover] = useState<string>('')

  // todo(nc): refactor into provider?
  const [{data, rawData}, dispatch] = useReducer(
    dataReducer,
    initDataState,
  )

  const [loadingTL, setLoadingTL] = useState(false)

  const [opts, setOpts] = useState<Options>({
    display: 'nodes',
    density: true,
    versions: false,
    time: 'hourly',
    start: getStartTime(TAIL_DAYS),
    window: TAIL_DAYS
  })

  // note: endtime is not currently an option
  const [end] = useState<Date>(endOfHour(new Date()))


  useEffect(() => {
    setLoading(true)

    const p1 = BK.getNodeMeta(vsn)
      .then((data: BK.NodeMeta) => {
        setNodeMeta(data)

        if (!data) {
          setVsnNotFound(true)
          return
        }
      })

    const p2 = BK.getManifest(vsn)
      .then(data => {
        setManifest(data)

        const id = data.name
        setNodeID(id)

        BK.getNode(id)
          .then(data => setBKMeta(data))
          .catch(err => setError(err))
      }).catch(() => { /* do nothing for now */ })

    const p3 = BH.getSimpleNodeStatus(vsn)
      .then((records) => {
        const elapsed = records.map(o => new Date().getTime() - new Date(o.timestamp).getTime())
        const isReporting = elapsed.some(val => val < ELAPSED_FAIL_THRES)
        setStatus(isReporting ? 'reporting' : 'not reporting')
      }).catch(() => setStatus('unknown'))

    const p4 = BH.getGPS(vsn)
      .then(d => setLiveGPS(d))
      .catch(() => setLiveGPS(null))


    Promise.all([p1, p2, p3, p4])
      .finally(() => setLoading(false))

  }, [vsn, setLoading])


  // data timeline
  useEffect(() => {
    if (!nodeMeta) return
    setLoadingTL(true)
    fetchRollup({...opts, vsn})
      .then(data => dispatch({type: 'INIT_DATA', data, nodeMetas: [nodeMeta]}))
      .catch(error => dispatch({type: 'ERROR', error}))
      .finally(() => setLoadingTL(false))
  }, [vsn, nodeMeta, opts])


  // fetch public ECR apps to determine if apps are indeed public
  useEffect(() => {
    ECR.listApps('public')
      .then(ecr => setECR(ecr))
  }, [])

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

  const handleOptionChange = (name, val) => {
    if (['nodes', 'apps'].includes(name)) {
      setOpts(prev => ({...prev, display: name}))
      return
    } else  if (name == 'time') {
      const time = val
      const data = parseData({data: rawData, time})
      dispatch({type: 'SET_DATA', data})
      setOpts(prev => ({...prev, [name]: time}))
      return
    } else if (name == 'versions') {
      const versions = val
      const data = parseData({data: rawData, time: opts.time, versions})
      dispatch({type: 'SET_DATA', data})
      setOpts(prev => ({...prev, [name]: versions}))
      return
    } else if (name == 'density') {
      setOpts(prev => ({...prev, [name]: val}))
    } else if (name == 'window') {
      setOpts(prev => ({
        ...prev,
        ...(val && {start: getStartTime(val)}),
        window: val
      }))
    } else {
      throw `unhandled option state change name=${name}`
    }
  }


  const {
    node_type, shield, top_camera, bottom_camera,
    left_camera, right_camera
  } = nodeMeta || {}

  if (vsnNotFound)
    return <NodeNotFound />

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
              <h1 className="no-margin">
                {node_type == 'WSN' ?
                  'Wild Sage Node' : node_type
                } {vsn} <small className="muted">{nodeID}</small>
              </h1>

              <Tooltip
                placement="top"
                title={
                  admin ? 'Node health' : <>Admin page <LaunchIcon style={{fontSize: '1.1em'}}/></>
                }
              >
                <Button
                  href={nodeMeta ? `${config.adminURL}/node/${vsn}?tab=health` : ''}
                  {...(admin ? {} : {target: '_blank'})}
                >
                  <span className={`${status == 'reporting' ? 'success font-bold' : 'failed font-bold'}`}>
                    {status}
                  </span>
                </Button>
              </Tooltip>
            </div>
          </Card>

          <Card noPad style={{marginBotton: 0}}>
            <ManifestTabs
              counts={{
                Sensors: manifest?.sensors.length,
                Computes: manifest?.computes.length,
                Peripherals: manifest?.resources.length,
                'LoRaWAN Devices': manifest?.lorawanconnections.length
              }}
              admin={admin}
              lorawan= {manifest?.sensors.some(item => item.capabilities.includes('lorawan'))}
            />

            {tab == 'sensors' && manifest &&
              <TableContainer>
                <Table
                  primaryKey='name'
                  columns={sensorCols}
                  rows={manifest.sensors}
                  enableSorting
                />
              </TableContainer>
            }

            {tab == 'computes' && manifest &&
              <TableContainer>
                <Table
                  primaryKey='name'
                  columns={computeCols}
                  rows={manifest.computes}
                  enableSorting
                />
              </TableContainer>
            }
            
            {tab == 'lorawandevices' && manifest &&
              <TableContainer>
                <Table
                  primaryKey='deveui'
                  columns={lorawandeviceCols}
                  rows={manifest.lorawanconnections}
                  enableSorting
                />
              </TableContainer>
            }

            {tab == 'peripherals' && manifest &&
              <TableContainer>
                <Table
                  primaryKey='name'
                  columns={resourceCols}
                  rows={manifest.resources}
                  enableSorting
                />
              </TableContainer>
            }
          </Card>

          {tab == 'overview' &&
            <div className="flex gap">
              <Card noPad className="meta-left">
                <MetaTable
                  title="Overview"
                  rows={[
                    ...metaRows1,
                    {
                      id: 'gps',
                      label: <>GPS ({hasStaticGPS(manifest) ? 'static' : 'from stream'})</>,
                      format: () =>
                        <div className="gps">
                          {hasStaticGPS(manifest) &&
                            <Clipboard content={`${manifest.gps_lat},\n${manifest.gps_lon}`} />
                          }
                          {!hasStaticGPS(manifest) && liveGPS &&
                            <>
                              <Clipboard content={`${liveGPS.lat},\n${liveGPS.lon}`} />
                              <Tooltip title="Last available GPS timestamp">
                                <small className="muted">
                                  {new Date(liveGPS.timestamp).toLocaleString()}
                                </small>
                              </Tooltip>
                            </>
                          }
                          {!hasStaticGPS(manifest) && !liveGPS && !loading &&
                            <span className="muted">not available</span>
                          }
                          {!hasStaticGPS(manifest) && !liveGPS && loading &&
                            <span className="muted">loading...</span>
                          }
                        </div>
                    }
                  ]}
                  data={{...nodeMeta, ...bkMeta}}
                />
              </Card>

              <Card noPad className="meta-right">
                {manifest &&
                  <>
                    <div className="summary-table">
                      <MetaTable
                        title="Sensors"
                        rows={sensorOverview}
                        data={manifest}
                      />
                    </div>

                    <div className="summary-table">
                      <MetaTable
                        title="Computes"
                        rows={computeOverview}
                        data={manifest}
                      />
                    </div>

                    <div className="summary-table">
                      <MetaTable
                        title="Hardware"
                        rows={hardwareMeta}
                        data={manifest}
                      />
                    </div>
                  </>
                }
              </Card>
            </div>
          }

          {admin && tab == 'health' &&
            <AdminNodeHealth />
          }

          {/* timeline card */}
          <Card>
            <div className="timeline-title flex items-center gap">
              <h2 className="no-margin">Last {opts.window.replace(/-|d/g, '')} days of data</h2>
              <DataOptions onChange={handleOptionChange} opts={opts} condensed density aggregation />
            </div>

            {loadingTL &&
              <div className="clearfix w-full">
                <TimelineSkeleton includeHeader={false} />
              </div>
            }

            {data && !!Object.keys(data).length && ecr && !loadingTL &&
              <Timeline
                data={data[vsn]}
                cellUnit={opts.time == 'daily' ? 'day' : 'hour'}
                colorCell={opts.density ? colorDensity : stdColor}
                startTime={opts.start}
                endTime={end}
                tooltip={(item) => `
                  <div style="margin-bottom: 5px;">
                    ${new Date(item.timestamp).toDateString()} ${new Date(item.timestamp).toLocaleTimeString([], {timeStyle: 'short'})} (${opts.time})
                  </div>
                  ${item.meta.plugin}<br>
                  ${item.value.toLocaleString()} records`
                }
                onCellClick={(data) => {
                  const {timestamp, meta} = data
                  const {vsn, origPluginName} = meta
                  const date = new Date(timestamp)
                  const end = (opts.time == 'daily' ? addDays(date, 1) : addHours(date, 1)).toISOString()
                  window.open(`${config.portal}/query-browser?nodes=${vsn}&apps=${origPluginName}.*&start=${timestamp}&end=${end}`, '_blank')
                }}
                yFormat={(label) => <AppLabel label={label} ecr={ecr} />}
                labelWidth={admin ? ADMIN_TL_LABEL_WIDTH : TL_LABEL_WIDTH}
              />
            }

            {data && !Object.keys(data).length &&
              <div className="clearfix muted">No data available</div>
            }
          </Card>

          {shield &&
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
                    {hasMetOne(manifest) &&
                      <RecentDataTable
                        items={format(['es642AirQuality'], vsn)}
                      />
                    }
                  </div>
                </div>
              }
            </Card>
          }

          <Card>
            <h2>Images</h2>
            <Imgs>
              <RecentImages vsn={vsn} horizontal />
            </Imgs>
          </Card>

          {shield &&
            <Card>
              <h2>Audio</h2>
              <Audio vsn={vsn} className="hover-audio"/>
            </Card>
          }
        </LeftSide>

        <RightSide className="justify-end">
          <Card noPad>
            {hasStaticGPS(manifest) && status && vsn &&
              <Map
                showUptime={false}
                // @ts-ignore; todo: map does not actually need manifest info since showUptime == false
                data={[{
                  vsn,
                  lat: manifest.gps_lat,
                  lng: manifest.gps_lon,
                  status,
                  ...nodeMeta,
                }]} />
            }
            {!hasStaticGPS(manifest) && liveGPS && status &&
              <Map
                showUptime={false}
                // @ts-ignore; todo: map does not actually need manifest info since showUptime == false
                data={[{
                  vsn,
                  lat: liveGPS.lat,
                  lng: liveGPS.lon,
                  status,
                  ...nodeMeta
                }]}
              />
            }
            {!hasStaticGPS(manifest) && !liveGPS && !loading &&
              <div className="muted" style={{margin: 18}}>(Map not available)</div>
            }
          </Card>

          {vsn?.charAt(0) == 'W' ?
            <WSNView>
              <img src={wsnode} width={WSN_VIEW_WIDTH} />
              <VSN>{vsn}</VSN>
              {nodeMeta &&
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
            :
            <div style={{width: WSN_VIEW_WIDTH}} />
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
    flex: 3;
    height: 100%;

    tbody td:first-child {
      white-space: nowrap;
    }
  }

  .meta-right {
    flex: 4;

    .summary-table table td:first-child {
      display: none;
    }
  }

  .data-tables div {
    width: 100%;
    margin-right: 3em
  }

  .gps {
    width: 150px;
    margin-bottom: 1em;

    pre {
      margin-bottom: 0;
    }

    .clipboard-content {
      // less padding since scroll not needed
      padding-bottom: 8px;
    }
  }

  .timeline-title {
    float: left;
    h2 { margin-right: 1em; }
  }

  table {
    width: 100%;
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

const TableContainer = styled.div`
  padding: 0 1rem 1rem 1rem;
`

