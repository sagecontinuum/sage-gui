import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useParams, useLocation, Link} from 'react-router-dom'

import CheckIcon from '@mui/icons-material/CheckCircleRounded'
import Alert from '@mui/material/Alert'

import * as BH from '../../apis/beehive'
import * as BK from '../../apis/beekeeper'
import * as SES from '../../apis/ses'
import { useProgress } from '../../../components/progress/ProgressProvider'

import TimelineChart, {colors} from '../../viz/TimelineChart'

import RecentData from './RecentData'


const cols = [
  'node_type',
  // 'vsn',
  // 'node_id',
  'project',
  'location',
  'top_camera',
  'bottom_camera',
  'left_camera',
  'right_camera',
  'shield',
  'modem',
  'modem_sim',
  'nx_agent',
  'build_date',
]

function format(label: string, val: string) {
  if (label == 'project')
    return <Link to={`/status?project=${val}`}>{val}</Link>
  else if (label == 'location')
    return <Link to={`/status?location=${val}`}>{val}</Link>

  return typeof val == 'boolean' ?
    (val ? 'yes' : 'no'):
    ((!val || val == 'none') ? '-' : val)
}


function getDate(hours, days) {
  let d
  if (hours) {
    d = new Date()
    d.setHours(d.getHours() - hours)
  } else if (days) {
    d = new Date()
    d.setDate(d.getDate() - days)
  } else {
    d = new Date()
    d.setDate(d.getDate() - 2)
  }

  return d
}

function sanityColor(val, obj) {
  if (val == null)
    return colors.noValue

  if (val <= 0)
    return colors.green
  else if (obj.meta.severity == 'warning')
    return colors.orange
  else
    return colors.red4
}


function SignOffTable({data}) {
  if (!data) return <></>

  return (
    <SignedTable className="hor-key-value manifest" style={{width: '325px'}}>
      <thead>
        <tr className="cat-header">
          <th colSpan="2">Phase 2 Sign-offs</th>
          <th colSpan="2">Phase 3 Sign-offs</th>
        </tr>

        <tr>
          {Object.keys(data)
            .filter(k => !['vsn', 'node_id', 'Final Sign-off'].includes(k))
            .sort()
            .map(label => <th key={label}>{label.replace(/Phase|2|3|Sign\-off/g,'')}</th>)
          }
          <th>Final Sign-off</th>
        </tr>
      </thead>

      <tbody>
        <tr>
          {Object.keys(data)
            .filter(k => !['vsn', 'node_id', 'Final Sign-off'].includes(k))
            .sort()
            .map(name => {
              const val = data[name]
              return <td key={name}>
                {!val ? <b className="fatal">No</b> : <CheckIcon className="success" />}
              </td>
            })}
          <td>
            {!data['Final Sign-off'] ?
              <b className="fatal">No</b> : <CheckIcon className="success" />
            }
          </td>
        </tr>
      </tbody>
    </SignedTable>
  )
}

const SignedTable = styled.table`
  margin-top: 2em;
`


export default function NodeView() {
  const {node} = useParams()
  const params = new URLSearchParams(useLocation().search)
  const factoryView = params.get('factory')

  const hours = params.get('hours')
  const days = params.get('days')

  const { setLoading } = useProgress()

  const [manifest, setManifest] = useState(null)
  const [vsn, setVsn] = useState(null)
  const [meta, setMeta] = useState(null)
  const [pluginData, setPluginData] = useState<SES.GroupedByPlugin>()
  const [sanityData, setSanityData] = useState<BH.MetricsObj>(null)

  const [factory, setFactory] = useState(null)

  const [health, setHealth] = useState(null)

  const [loading1, setLoading1] = useState(null)
  const [loading2, setLoading2] = useState(null)
  const [loading3, setLoading3] = useState(null)

  const [error1, setError1] = useState(null)
  const [error2, setError2] = useState(null)
  const [error3, setError3] = useState(null)

  const [healthError, setHealthError] = useState(null)


  useEffect(() => {
    setLoading(true)

    BK.getManifest({node: node.toUpperCase()})
      .then(data => {
        setManifest(data)

        // if no manifest, we can not get the vsn for node health
        if (!data) return

        const vsn = data.vsn
        setVsn(vsn)
        BH.getNodeDeviceHealth(vsn)
          .then((data) => setHealth(data))
          .catch((err) => setHealthError(err))
      })


    setLoading1(true)
    const p1 = SES.getGroupedByPlugin(node)
      .then((data) => {
        const d = getDate(hours, days)

        for (const key of Object.keys(data)) {
          data[key] = data[key].sort((a, b) =>
            +new Date(a.timestamp) - +new Date(b.timestamp)
          ).filter(obj => new Date(obj.timestamp) > d)

          // exclude empty lists (for now)
          if (data[key].length == 0)
            delete data[key]
        }

        if (!Object.keys(data).length) {
          setPluginData(null)
          return
        }

        setPluginData(data)
      }).catch((err) => setError1(err))
      .finally(() => setLoading1(false))

    setLoading2(true)
    const p2 = BH.getSanityChart(node.toLowerCase())
      .then((sanity) => {
        if (!sanity) {
          setSanityData(sanity)
          return
        }

        const data = sanity[node.toLowerCase()][`${node.toLowerCase()}.ws-nxcore`]

        if (hours || days) {
          const d = getDate(hours, days)

          for (const key of Object.keys(data)) {
            data[key] = data[key].filter(obj => new Date(obj.timestamp) > d)
          }
        }

        setSanityData(data)
      }).catch((err) => setError2(err))
      .finally(() => setLoading2(false))

    setLoading3(true)
    const p3 = BK.getNode(node)
      .then(data => setMeta(data))
      .catch(err => setError3(err))
      .finally(() => setLoading3(false))

    Promise.all([p1, p2, p3])
      .then(() => setLoading(false))

  }, [node, setLoading, days, hours])


  return (
    <Root>
      <h1>
        Node {vsn} | <small className="muted">{node}</small>
      </h1>

      {manifest &&
        <table className="hor-key-value manifest">
          <thead>
            <tr className="cat-header">
              {cols.map(name => name == 'top_camera' ?
                <th key={name} colSpan="4">Cameras</th> :
                <th key={name}></th>
              ).slice(0, -3)
              }
              <th></th>
            </tr>

            <tr>
              {cols.map(name => {
                const label = name.replace(/_/g, ' ').replace('camera', '')
                  .replace(/\b[a-z](?=[a-z]{1})/g, c => c.toUpperCase())
                return <th key={label}>{label}</th>
              })}
              <th>Registration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {cols.map(name => {
                const val = manifest[name]
                return <td key={name}>{format(name, val)}</td>
              })}
              <td>{new Date(meta?.registration_event).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      }

      <div className="flex">
        <Charts className="flex column">
          <h2>Health</h2>
          {health &&
            <TimelineChart
              data={health}
              colorCell={(val, obj) => {
                if (val == null)
                  return colors.noValue
                return val == 0 ? colors.red4 : colors.green
              }}
              tooltip={(item) =>
                `${new Date(item.timestamp).toDateString()} ${new Date(item.timestamp).toLocaleTimeString()}<br>
                ${item.meta.device}<br>
                <b style="color: ${item.value == 0 ? colors.red3 : colors.green}">
                  ${item.value == 0 ? 'failed' : `success`}
                </b>
                `
              }
              margin={{right: 20}}
            />
          }

          {/* hide just for now
            <h2>Plugins</h2>
            {pluginData &&
              <TimelineChart
                data={pluginData}
                colorCell={(val, obj) => {
                  if (val == null)
                    return colors.noValue

                  if (val <= 0)
                    return colors.green
                  else if (obj.meta.severity == 'warning')
                    return colors.orange
                  else
                    return colors.red4
                }}
                tooltip={(item) =>
                  `${new Date(item.timestamp).toDateString()} ${new Date(item.timestamp).toLocaleTimeString()}<br>
                  <b style="color: ${item.value == 0 ? colors.green : colors.red3}">
                    ${item.value == 0 ? 'running' : `not running (${item.meta.status})`}
                  </b>
                  `
                }
                margin={{right: 20}}
              />
            }

            {!loading1 && !pluginData && !error1 &&
              <p className="muted">No (recent) plugin data available</p>
            }

            {error1 &&
              <Alert severity="error">{error1.message}</Alert>
            }
          */}

          <h2>Sanity Tests</h2>
          {sanityData &&
            <TimelineChart
              data={sanityData}
              yFormat={l => l.split('.').pop()}
              colorCell={sanityColor}
              tooltip={(item) =>
                `${new Date(item.timestamp).toDateString()} ${new Date(item.timestamp).toLocaleTimeString()}<br>
                <b style="color: ${sanityColor(item.value, item)}">
                  ${item.value == 0 ? 'passed' : (item.meta.severity == 'warning' ? 'warning' : 'failed')}
                </b>
                `
              }
              margin={{right: 20}}
            />
          }

          {!loading2 && !sanityData &&
            <p className="muted">No sanity data available</p>
          }

          {error2 &&
            <Alert severity="error">{error2.message}</Alert>
          }

          {!loading3 && error3 &&
            <Alert severity="error">{error3.message}</Alert>
          }

        </Charts>

        <Data>
          {factoryView && manifest && manifest.factory && <SignOffTable data={manifest.factory} />}
          <RecentData node={node} />
        </Data>

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

  p {
    margin-bottom: 30px;
  }
`

const Charts = styled.div`
  flex-grow: 1;
  margin-bottom: 50px;
`

const Data = styled.div`
  min-width: 400px;
  max-width: 400px;
  margin-left: 2em;
`
