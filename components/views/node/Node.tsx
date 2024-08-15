/* eslint-disable max-len */
import { useEffect, useState, useReducer } from 'react'
import styled from 'styled-components'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { Alert } from '@mui/material'

import * as BH from '/components/apis/beehive'
import * as BK from '/components/apis/beekeeper'
import * as ECR from '/components/apis/ecr'

import { useProgress } from '/components/progress/ProgressProvider'
import { CardViewStyle, Card } from '/components/layout/Layout'
import NodeNotFound from './NodeNotFound'
import Audio from '/components/viz/Audio'
import Map from '/components/Map'
import format from '/components/data/dataFormatter'
import Timeline from '/components/viz/Timeline'
import TimelineSkeleton from '/components/viz/TimelineSkeleton'
import AppLabel from '/components/viz/TimelineAppLabel'
import Table from '/components/table/Table'
import { prettyList } from '/components/utils/units'

import RecentDataTable from '../RecentDataTable'
import RecentImages from '../RecentImages'

import adminSettings from '/apps/admin/settings'
import config from '/config'

// import KeyTable from './lorawandevice/collapsible'
import { deviceCols } from './lorawandevice/columns'
import QuestionMark from '@mui/icons-material/HelpOutlineRounded'

// todo(nc): promote/refactor into component lib
import DataOptions from '/components/input/DataOptions'
import { fetchRollup, parseData } from '/apps/sage/data/rollupUtils'
import { dataReducer, initDataState } from '/apps/sage/data/dataReducer'
import { type Options, colorDensity, stdColor } from '/apps/sage/data/Data'

import { endOfHour, subDays, subYears, addHours, addDays } from 'date-fns'

import { LABEL_WIDTH as ADMIN_TL_LABEL_WIDTH } from './AdminNodeHealth'
import NodeOverview from './NodeOverview'
import NodeGraphic from './NodeGraphic'


const ELAPSED_FAIL_THRES = adminSettings.elapsedThresholds.fail

const TL_LABEL_WIDTH = 175 // default timeline label width
const TAIL_DAYS = '-7d'


// todo(nc): refactor more into a general config
const COMMON_SENSORS = ['BME680', 'RG-15', 'ES-642']

const hasSensor = (meta: BK.FlattenedManifest, sensors: string | string[]) : boolean =>
  meta?.sensors.some(({hw_model}) => {
    sensors = Array.isArray(sensors) ? sensors : [sensors]
    const re = new RegExp(sensors.join('|'), 'gi')
    return hw_model.match(re)
  })


const getStartTime = (str) =>
  str.includes('y') ?
    subYears(new Date(), str.replace(/-|y/g, '')) :
    subDays(new Date(), str.replace(/-|d/g, ''))


export const hasShield = (computes: BK.FlattenedManifest['computes']) =>
  !!computes.some(o => o.zone == 'shield')

// todo(nc): solution assumes compute/sensor names are uniqu
const getInActive = (data: BK.FlattenedManifest) => [
  ...data.computes.reduce((acc, o) => !o.is_active ? [...acc, o.name] : acc, []),
  ...data.sensors.reduce((acc, o) => !o.is_active ? [...acc, o.hw_model] : acc, [])
]



type Props = {
  admin?: boolean
}

export default function NodeView(props: Props) {
  const {admin} = props
  const vsn = useParams().vsn as BK.VSN

  const [params] = useSearchParams()
  const tab = params.get('tab') || 'overview'

  const { loading, setLoading } = useProgress()

  const [node, setNode] = useState<BK.Node>()
  const [manifest, setManifest] = useState<BK.FlattenedManifest>()
  const [inactive, setInactive] = useState<(BK.Compute['name'] | BK.SensorHardware['hw_model'])[]>()
  const [bkMeta, setBKMeta] = useState<BK.BKState | {registration_event: null}>()

  const [status, setStatus] = useState<string>()
  const [liveGPS, setLiveGPS] = useState<BH.GPS>()
  const [ecr, setECR] = useState<ECR.AppDetails[]>()

  const [error, setError] = useState(null)
  const [vsnNotFound, setVsnNotFound] = useState(null)

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

  const [loraDataWithRssi, setDataWithRssi] = useState<BK.LorawanConnection[]>([])

  useEffect(() => {
    setLoading(true)

    const p1 = BK.getNode(vsn)
      .then((data: BK.Node) => setNode(data))
      .catch((err) => {
        if (err.message == 'Not found.')
          setVsnNotFound(true)
      })

    const p2 = BK.getManifest(vsn)
      .then(data => {
        setManifest(data)
        setInactive(getInActive(data))

        const id = data.name

        // fetch the registration time from beekeeper
        BK.getBKState(id)
          .then(data => setBKMeta(data))
          .catch(err => {
            setError({message: `Beekeeper ${err.message}. Hence, the node registration time for ${vsn} was not found.`})
            setBKMeta({registration_event: null})
          })
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
    if (!node) return
    setLoadingTL(true)
    fetchRollup({...opts, vsn})
      .then(data => dispatch({type: 'INIT_DATA', data, nodes: [node]}))
      .catch(error => dispatch({type: 'ERROR', error}))
      .finally(() => setLoadingTL(false))
  }, [vsn, node, opts])


  // fetch public ECR apps to determine if apps are indeed public
  useEffect(() => {
    ECR.listApps('public')
      .then(ecr => setECR(ecr))
  }, [])

  // fetch rssi
  useEffect(() => {
    (async () => {
      setDataWithRssi(await BH.fetchDataWithRssi(manifest))
    })()
  }, [manifest])


  const handleOptionChange = (name, val) => {
    setError(null)
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
        ...(val && {window: val, start: getStartTime(val)})
      }))
    } else {
      throw `unhandled option state change name=${name}`
    }
  }

  const shield = manifest?.computes ? hasShield(manifest.computes) : false

  if (vsnNotFound)
    return <NodeNotFound />

  return (
    <Root>
      <CardViewStyle />

      {error &&
        <Alert severity="info">{error.message}</Alert>
      }

      <div className="flex">
        <LeftSide className="flex column gap">
          <NodeOverview
            node={node}
            manifest={manifest}
            bkMeta={bkMeta}
            loraDataWithRssi={loraDataWithRssi}
            tab={tab}
            admin={admin}
            liveGPS={liveGPS}
            loading={loading}
          />

          {manifest?.sensors.some(item => item.capabilities.includes('lorawan')) &&
            <Card>
              <h2>
                LoRaWAN
                <Link to={`${config.docs}/about/architecture#lorawan`}>
                  <HelpIcon/>
                </Link>
              </h2>
              <Table
                primaryKey='deveui'
                columns={deviceCols}
                rows={loraDataWithRssi}
                enableSorting
                // collapsible={<KeyTable row={loraDataWithRssi} />}
              />
            </Card>
          }

          {/* timeline card */}
          <Card>
            <div className="timeline-title flex items-start gap">
              <h2>Last {opts.window.replace(/-|d/g, '')} days of data</h2>
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
                  window.open(`/query-browser?nodes=${vsn}&apps=${origPluginName}.*&start=${timestamp}&end=${end}`, '_blank')
                }}
                yFormat={(label) => <AppLabel label={label} ecr={ecr} />}
                labelWidth={admin ? ADMIN_TL_LABEL_WIDTH : TL_LABEL_WIDTH}
              />
            }

            {data && !Object.keys(data).length && !loadingTL &&
              <div>
                <div className="clearfix"></div>
                <p className="muted">No data available</p>
              </div>
            }
          </Card>

          <Card>
            <h2>Sensors</h2>
            {vsn && inactive &&
              <>
                {!!inactive.length &&
                  <Alert severity="info" sx={{marginBottom: '1em'}}>
                    {prettyList(inactive)} {inactive.length > 1 ? 'are' : 'is'} marked as inactive
                  </Alert>
                }
                <div className="flex data-tables">
                  {hasSensor(manifest, 'BME680') &&
                    <RecentDataTable
                      items={format(['temp', 'humidity', 'pressure'], vsn)}
                      className="hover-bme"
                      inactive={inactive.some(name => /BME680/i.test(name))}
                    />
                  }

                  <div>
                    {hasSensor(manifest, 'RG-15') &&
                      <RecentDataTable
                        items={format(['raingauge'], vsn)}
                        className="hover-rain"
                        inactive={inactive.some(name => /RG-15|/i.test(name))}
                      />
                    }
                    {hasSensor(manifest, 'ES-642') &&
                      <RecentDataTable
                        items={format(['es642AirQuality'], vsn)}
                        inactive={inactive.some(name => /ES-642/i.test(name))}
                      />
                    }
                  </div>
                </div>
              </>
            }
            {!hasSensor(manifest, COMMON_SENSORS) &&
              <p className="muted">
                No configuration was found for
                common sensors ({COMMON_SENSORS.slice(0, -1).join(', ')}, or {COMMON_SENSORS.slice(-1)})
              </p>
            }
          </Card>

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
            {node?.hasStaticGPS && status &&
              <Map
                showUptime={false}
                // @ts-ignore; todo: map does not actually need manifest info since showUptime == false
                data={[{
                  ...node,
                  hasLiveGPS: !!liveGPS,
                  status
                }]} />
            }
            {!node?.hasStaticGPS && !!liveGPS && status &&
              <Map
                showUptime={false}
                // @ts-ignore; todo: map does not actually need manifest info since showUptime == false
                data={[{
                  ...node,
                  lat: liveGPS.lat,
                  lng: liveGPS.lon,
                  hasLiveGPS: true,
                  status
                }]}
              />
            }
            {!node?.hasStaticGPS && !liveGPS && !loading &&
              <div className="muted" style={{margin: 18}}>(Map not available)</div>
            }
          </Card>

          <NodeGraphic node={node} shield={shield} />
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

export const TableContainer = styled.div`
  padding: 0 1rem 1rem 1rem;
`


const HelpIcon = styled(QuestionMark)`
  width: 15px;
  color: #1c8cc9;
`