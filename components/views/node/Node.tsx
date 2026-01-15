/* eslint-disable max-len */
import { useEffect, useState, useMemo } from 'react'
import { styled } from '@mui/material'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { Alert } from '@mui/material'
import Masonry from '@mui/lab/Masonry'


import * as BH from '/components/apis/beehive'
import * as BK from '/components/apis/beekeeper'

import { useProgress } from '/components/progress/ProgressProvider'
import { CardViewStyle, Card } from '/components/layout/Layout'
import NodeNotFound from './NodeNotFound'
import Audio from '/components/viz/Audio'
import Map from '/components/Map'
import Table, { TableSkeleton } from '/components/table/Table'
import { prettyList, quickRanges } from '/components/utils/units'

import RecentDataTable, { EmptyTable } from '../RecentDataTable'
import RecentImages from '../RecentImages'

// import KeyTable from './lorawandevice/collapsible' // (alternate design)
import { deviceCols } from './lorawandevice/columns'

import { HelpOutlineRounded} from '@mui/icons-material'

import NodeOverview from './NodeOverview'
import NodeGraphic from './NodeGraphic'

import adminSettings from '/apps/admin/settings'
import config from '/config'

import { measurements, skipSensorPreview } from '/components/measurement.config'
import NodeEditBtn from './NodeEditBtn'
import NodeTimeline from './NodeTimeline'

const ELAPSED_FAIL_THRES = adminSettings.elapsedThresholds.fail



// todo(nc): refactor more into a general config
const COMMON_SENSORS = ['BME680', 'RG-15', 'ES-642']

const hasSensor = (meta: BK.Node, sensors: string | string[]) : boolean =>
  meta?.sensors.some(({hw_model}) => {
    sensors = Array.isArray(sensors) ? sensors : [sensors]
    const re = new RegExp(sensors.join('|'), 'gi')
    return hw_model.match(re)
  })



export const hasShield = (computes: BK.FlattenedManifest['computes']) =>
  !!computes.some(o => o.zone == 'shield')

// todo(nc): solution assumes compute/sensor names are uniqu
const getInActive = (data: BK.Node) => [
  ...data.computes.reduce((acc, o) => !o.is_active ? [...acc, o.name] : acc, []),
  ...data.sensors.reduce((acc, o) => !o.is_active ? [...acc, o.hw_model] : acc, [])
]


const getSensorList = (data: BK.Node) => {
  const sensors = data?.sensors.filter(o =>
    !o.capabilities.includes('camera') &&
    !skipSensorPreview.includes(o.name)
  )

  return sensors
}


const getVisibleCameras = (node: BK.Node, isAdmin?: boolean) => {
  const {sensors} = node

  const visibleSensors = isAdmin ? sensors : sensors.filter(o => o.is_active)
  const cameras = visibleSensors.filter(o => o.capabilities.includes('Camera'))

  return cameras.map(o => o.name)
}

type Props = {
  admin?: boolean
}

export default function NodeView(props: Props) {
  const {admin} = props
  const vsn = useParams().vsn as BK.VSN

  const [params] = useSearchParams()
  const tab = params.get('tab') || 'overview'

  const {loading, setLoading} = useProgress()

  const [node, setNode] = useState<BK.Node>()
  const [manifest, setManifest] = useState<BK.FlattenedManifest>()
  const [inactive, setInactive] = useState<(BK.Compute['name'] | BK.SensorHardware['hw_model'])[]>()
  const [bkMeta, setBKMeta] = useState<BK.BKState | {registration_event: null}>()

  const [status, setStatus] = useState<string>()
  const [liveGPS, setLiveGPS] = useState<BH.GPS>()

  const [error, setError] = useState(null)
  const [vsnNotFound, setVsnNotFound] = useState(null)


  const [loraDataWithRssi, setDataWithRssi] = useState<BK.LorawanConnection[]>()

  useEffect(() => {
    setLoading(true)

    const p1 = BK.getNode(vsn)
      .then((data: BK.Node) => {
        setNode(data)
        setInactive(getInActive(data))

        const id = data.name
        // fetch the registration time from beekeeper
        BK.getBKState(id)
          .then(data => setBKMeta(data))
          .catch(err => {
            setError({message: `Beekeeper ${err.message}. Hence, the node registration time for ${vsn} was not found.`})
            setBKMeta({registration_event: null})
          })
      })
      .catch((err) => {
        if (err.message == 'Not found.')
          setVsnNotFound(true)
      })

    const p2 = BK.getManifest(vsn)
      .then(data => setManifest(data))
      .catch(() => { /* do nothing for now */ })

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



  // fetch rssi
  useEffect(() => {
    if (!manifest) return
    BH.getLoraWithRssi(manifest)
      .then(data => setDataWithRssi(data))
  }, [manifest])




  const shield = manifest?.computes ? hasShield(manifest.computes) : false


  const sensors = useMemo(() => {
    if (!manifest || !node || !vsn || !inactive) return

    return getSensorList(node)
      .map((obj, i) => {
        const {hw_model, name, capabilities, is_active} = obj

        const config = measurements[hw_model]
        const start = config?.start || '-1d'
        const {sensor} = config || {}

        const isLora = capabilities.includes('lorawan')
        const deviceName = isLora ? name.replace(/_/g , ' ') : null

        let scope
        if (!isLora) {
          // todo(nc): scope is only available in manifests, add to nodes endpoint
          scope = manifest.sensors.find(obj => obj.name == name).scope
        }

        const items = config?.names.map(obj => {
          const {name, label, units} = obj

          return {
            label: label || name,
            query: {
              vsn,
              name,
              start,
              sensor,
              deviceName // for lorawan sensor
            },
            units,
            linkParams: ({meta}) => [
              `type=names`,
              `nodes=${meta.vsn}`,
              `names=${name}`,
              `start=${start}`,
              ...sensor ? [`&sensors=${sensor}`] : [],
              ...deviceName ? [`&deviceNames=${deviceName}`] : []
            ].join('&')
          }
        })

        if (!items) {
          return (
            <EmptyTable
              key={i}
              title={hw_model}
              content="Preview not configured"
            />
          )
        }

        if (!admin && !is_active) {
          return (
            <EmptyTable
              key={i}
              title={hw_model}
              content={<div className="flex items-center justify-between">
                The {hw_model} sensor is marked as inactive {<NodeEditBtn id={node.id}/>}
              </div>}
            />
          )
        }

        if (!admin && inactive.includes(scope)) {
          return (
            <EmptyTable
              key={i}
              title={hw_model}
              content={`The ${scope} is marked as inactive`}
            />
          )
        }

        return (
          <RecentDataTable
            key={i}
            title={deviceName ? deviceName : hw_model}
            items={items}
            previewLabel={quickRanges[start]}
            className={`hover-${hw_model}`}
          />
        )
      })
  }, [manifest, node, inactive, vsn])



  if (vsnNotFound)
    return <NodeNotFound />

  return (
    <Root>
      {CardViewStyle}
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
            status={status}
          />

          {manifest?.sensors.some(item => item.capabilities.includes('lorawan')) &&
            <Card>
              <h2>
                LoRaWAN
                <Link to={`${config.docs}/about/architecture#lorawan`}>
                  <HelpIcon/>
                </Link>
              </h2>
              {loraDataWithRssi &&
                <Table
                  primaryKey='deveui'
                  columns={deviceCols}
                  rows={loraDataWithRssi}
                  enableSorting
                  emptyNotice="No devices found"
                  // collapsible={<KeyTable row={loraDataWithRssi} />}
                />
              }
              {!loraDataWithRssi &&
                <TableSkeleton noSearch rows={5} />
              }
            </Card>
          }

          <Card noPad>
            <NodeTimeline node={node} />
          </Card>

          <Card>
            <h2 className="flex justify-between">
              Sensors <NodeEditBtn id={node?.id} />
            </h2>
            {inactive &&
              <>
                {admin && !!inactive.length &&
                  <Alert severity="info" sx={{marginBottom: '1em'}} action={<NodeEditBtn id={node?.id} />}>
                    {prettyList(inactive)} {inactive.length > 1 ? 'are' : 'is'} marked as inactive
                  </Alert>
                }
                <Masonry columns={2} spacing={2}>
                  {sensors}
                </Masonry>
              </>
            }
            {!hasSensor(node, COMMON_SENSORS) && vsn != 'X001' &&
              <p className="muted">
                No configuration was found for
                common sensors ({COMMON_SENSORS.slice(0, -1).join(', ')}, or {COMMON_SENSORS.slice(-1)})
              </p>
            }
          </Card>

          <Card>
            <h2>Images</h2>
            <Imgs>
              {node &&
                <RecentImages
                  vsn={vsn}
                  cameras={getVisibleCameras(node, admin)}
                  horizontal
                />
              }
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


const Root = styled('div')`
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

  .timeline-title {
    float: left;
    h2 { margin-right: 1em; }
  }
`

const Imgs = styled('div')`
  img {
    max-width: 380px;
    object-fit: contain;
  }
`

const LeftSide = styled('div')`
  margin: 20px;
  flex: 2 1 auto;
`

const RightSide = styled('div')`
  margin: 20px 20px 20px 15px;
`

export const TableContainer = styled('div')`
  padding: 0 1rem 1rem 1rem;
`


const HelpIcon = styled(HelpOutlineRounded)`
  width: 15px;
  color: #1c8cc9;
`
