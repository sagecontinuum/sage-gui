import { useState } from 'react'

import styled from 'styled-components'
import { Link } from 'react-router-dom'

import { Button, Tooltip, IconButton } from '@mui/material'
import LaunchIcon from '@mui/icons-material/LaunchRounded'
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined'
import InfoIcon from '@mui/icons-material/InfoOutlined'
import Grid from '@mui/material/Grid2'

import { Card } from '/components/layout/Layout'
import MetaTable from '/components/table/MetaTable'
import Table from '/components/table/Table'
import ManifestTabs from './ManifestTabs'
import GpsClipboard from './GpsClipboard'
import * as nodeFormatters from '/components/views/nodes/nodeFormatters'

import AdminNodeHealth from './AdminNodeHealth'
import config from '/config'
import { hardwareCols } from './lorawandevice/columns'

// todo(nc): promote/refactor into component lib
import { startCase } from 'lodash'
import ConfirmationDialog from '/components/dialogs/ConfirmationDialog'

import * as BH from '/components/apis/beehive'
import * as BK from '/components/apis/beekeeper'

import { hasShield, TableContainer } from './Node'


const labelDict = {
  gps: 'GPS',
  bme280: 'T·P·H',
  bme680: 'T·P·H·G',
  aqt: 'AQT',
  wxt: 'WXT',
  nxcore: 'NX',
  nxagent: 'NXagent',
  rpi: 'RPi',
  sbcore: 'Sage Blade'
}


const getConfigTable = (o) => {
  const {description, datasheet, ...rest} = o
  return (
    <div style={{width: '300px'}}>
      <MetaTable
        title="Configuration Details"
        rows={Object.keys(rest).map(k => ({id: k, label: k}))}
        data={rest}
      />
    </div>
  )
}

const sanitizeLabel = (obj: {name: string}) => {
  const {name} = obj
  return <>
    {name in labelDict ? labelDict[name] : startCase(name.replace(/-|_/, ' '))}
  </>
}


const metaRows1 = [{
  id: 'project',
  format: (val) => <a href={`/nodes?project="${encodeURIComponent(val)}"`} target="_blank" rel="noreferrer">{val}</a>
}, {
  id: 'focus',
  format: (val) => <a href={`/nodes?focus="${encodeURIComponent(val)}"`} target="_blank" rel="noreferrer">{val}</a>
}, {
  id: 'cityAndState',
  label: 'City & State',
  format: (_, obj) =>
    <>
      <a href={`/nodes?city="${encodeURIComponent(obj.city)}"`} target="_blank" rel="noreferrer">
        {obj.cityStr}
      </a>,{' '}
      <a href={`/nodes?state="${encodeURIComponent(obj.state)}"`} target="_blank" rel="noreferrer">
        {obj.state}
      </a>
    </>
},
/* todo: add, if needed
{
  id: 'build_date',
  label: 'Built'
},
*/
{
  id: 'registration_event',
  label: 'Registration',
  format: (val) => {
    if (val === null)
      return <span className="muted">Not found</span>
    else if (!val)
      return <span className="muted">loading...</span>
    else
      return new Date(val).toLocaleString()
  }
},
{
  id: 'commission_date', // todo: update db
  label: 'Commissioned'
}]


const computeOverview = [{
  id: 'computes',
  format: (val, obj) => {
    const {computes} = obj

    return <NodeDetails data={computes} />
  },
}]

const hardwareMeta = [{
  id: 'all',
  format: (val, obj) => {
    const {modem, computes} = obj

    return (
      <Grid container>
        <Grid size={{xs: 3}}>
          <small className="muted font-bold">Stevenson Shield</small>
          <div>{hasShield(computes) ? 'yes' : 'no'}</div>
        </Grid>

        <Grid size={{xs: 3}}>
          {nodeFormatters.modem(modem, obj)}
        </Grid>

        <Grid size={{xs: 3}}>
          {nodeFormatters.modemSim(modem, obj)}
        </Grid>
      </Grid>
    )
  }
}]



const sensorOverview = [{
  id: 'cameras',
  format: (val, obj) => {
    const cameras = obj.sensors
      .filter(o => o.name.match(/camera/gi))

    if (!obj.sensors.length) {
      return <span className="muted">No sensors configured</span>
    }

    return <NodeDetails data={cameras} linkPath="/sensors" />
  }
}, {
  id: 'sensors',
  label: 'Sensors',
  format: (val, obj) => {
    const sensors = obj.sensors
      .filter(o => !o.name.match(/camera/gi))

    return <NodeDetails data={sensors} linkPath="/sensors" />
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


type NodeDetailsProps = {
  data: BK.SensorHardware[] | BK.ComputeHardware[]
  linkPath?: '/sensors'  // just sensors for now
}

function NodeDetails(props: NodeDetailsProps) {
  const {data, linkPath} = props

  const [details, setDetails] = useState<typeof data[0]>(null)

  const handleCloseDetails = () => setDetails(null)

  return (
    <Grid container>
      {data.map((o, i) =>
        <Grid size={{xs: 3}} key={i}>
          <NodeInfo>
            <small className="muted font-bold">
              {sanitizeLabel(o)}

              <Tooltip title="Show config">
                <IconButton onClick={() => setDetails(o)} size="small">
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            </small>
            <div>
              {linkPath ?
                <Link to={`${linkPath}/${o.hw_model}`}>{o.hw_model}</Link> :
                o.hw_model
              }
            </div>
          </NodeInfo>
        </Grid>
      )}

      {details &&
        <ConfirmationDialog
          title={details.hw_model}
          content={getConfigTable(details)}
          onClose={handleCloseDetails}
          onConfirm={handleCloseDetails}
          maxWidth="xl"
        />
      }
    </Grid>
  )

}



type Props = {
  node: BK.Node
  manifest: BK.FlattenedManifest
  bkMeta: BK.BKState | {registration_event: null}
  loraDataWithRssi: BK.LorawanConnection[]
  tab: string
  liveGPS: BH.GPS
  loading: boolean
  status: string
  admin?: boolean
}

export default function NodeOverview(props: Props) {
  const {
    node,
    manifest,
    bkMeta,
    loraDataWithRssi,
    tab,
    liveGPS,
    loading,
    status,
    admin
  } = props

  const {type, vsn} = node || {}

  return (
    <>
      <Card>
        <div className="flex items-center justify-between">
          <h1 className="no-margin">
            {type == 'WSN' ?
              'Wild Sage Node' : type
            } {node && nodeFormatters.vsnToDisplayName(vsn, node)}
          </h1>

          <Tooltip
            placement="top"
            title={
              admin ? 'Node health' : <>Admin page <LaunchIcon style={{fontSize: '1.1em'}}/></>
            }
          >
            <Button
              href={node ? `${config.adminURL}/node/${vsn}?tab=health` : ''}
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
            'Sensors': manifest?.sensors.length,
            'Computes': manifest?.computes.length,
            'Peripherals': manifest?.resources.length,
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

        {tab == 'lorawandevices' && loraDataWithRssi &&
          <TableContainer>
            <Table
              primaryKey='deveui'
              columns={hardwareCols}
              rows={loraDataWithRssi}
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
                  label: <>GPS ({node?.hasStaticGPS ? 'static' : 'from stream'})</>,
                  format: () =>
                    <>
                      {node?.hasStaticGPS && !liveGPS &&
                        <GpsClipboard data={{lat: node.gps_lat, lng: node.gps_lon, hasStaticGPS: true}} />
                      }
                      {node?.hasStaticGPS && liveGPS &&
                        <GpsClipboard
                          data={{lat: node.gps_lat, lng: node.gps_lon, hasStaticGPS: true, hasLiveGPS: true}} />
                      }
                      {!node?.hasStaticGPS && liveGPS &&
                        <>
                          <GpsClipboard
                            data={{lat: liveGPS.lat, lng: liveGPS.lon, hasStaticGPS: false, hasLiveGPS: true}} /><br/>
                          <Tooltip title="Last available GPS timestamp">
                            <small className="muted">
                              {new Date(liveGPS.timestamp).toLocaleString()}
                            </small>
                          </Tooltip>
                        </>
                      }
                      {!node?.hasStaticGPS && !liveGPS && !loading &&
                        <span className="muted">not available</span>
                      }
                      {!node?.hasStaticGPS && !liveGPS && loading &&
                        <span className="muted">loading...</span>
                      }
                    </>
                }
              ]}
              data={{...node, ...bkMeta}}
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
                {type == 'WSN' &&
                  <div className="summary-table">
                    <MetaTable
                      title="Hardware"
                      rows={hardwareMeta}
                      data={{...node, ...manifest}}
                    />
                  </div>
                }
              </>
            }
          </Card>
        </div>
      }

      {admin && tab == 'health' &&
        <AdminNodeHealth />
      }
    </>
  )
}


const NodeInfo = styled.div`
  position: relative;

  & .MuiIconButton-root  {
    visibility: hidden;
    position: absolute;
    top: -2px;
    margin-left: 5px;
    .MuiSvgIcon-root { font-size: 1rem;}
  }

  &:hover .MuiIconButton-root  {
    visibility: visible;
  }

  &:hover .MuiIconButton-root:hover {
    color: #222;
  }
`