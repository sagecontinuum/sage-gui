import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useParams, useLocation, Link } from 'react-router-dom'

import CheckIcon from '@mui/icons-material/CheckCircleRounded'
import Alert from '@mui/material/Alert'

import * as BH from '/components/apis/beehive'
import * as BK from '/components/apis/beekeeper'
import { useProgress } from '/components/progress/ProgressProvider'
import TimelineChart, { color } from '/components/viz/TimelineChart'

import AllRecentData from '/apps/common/AllRecentData'
import { startCase } from 'lodash'

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
  'commission_date'
]

function format(label: string, val: string) {
  if (label == 'project')
    return <Link to={`/status?project="${encodeURIComponent(val)}"`}>{val}</Link>
  else if (label == 'location')
    return <Link to={`/status?location="${encodeURIComponent(val)}"`}>{val}</Link>

  return typeof val == 'boolean' ?
    (val ? 'yes' : 'no'):
    ((!val || val == 'none') ? '-' : val)
}


function sanityColor(val, obj) {
  if (val == null)
    return color.noValue

  if (val <= 0)
    return color.green
  else if (obj.meta.severity == 'warning')
    return color.orange
  else
    return color.red4
}


function ceilingHour(date: Date) {
  const ms = 60 * 60 * 1000
  return new Date(Math.ceil(date.getTime() / ms ) * ms);
}


const signoffCols = [
  'Phase 2 Image Sign-off',
  'Phase 2 Audio Sign-off',
  'Phase 2 Sign-off',
  'Phase 3 Image Sign-off',
  'Phase 3 Audio Sign-off',
  'Final Sign-off'
]


function SignOffTable({data}) {
  if (!data) return <></>

  return (
    <SignedTable className="hor-key-value manifest">
      <thead>
        <tr className="cat-header">
          <th colSpan="3">Phase 2 Sign-offs</th>
          <th colSpan="3">Phase 3 Sign-offs</th>
        </tr>

        <tr>
          {signoffCols.map((label) =>
            <th key={label}>
              {!['Phase 2 Sign-off', 'Final Sign-off'].includes(label) ?
                label.replace(/Phase|2|3|Sign\-off/g,'') :
                label.replace(/Phase|2|3/g,'')
              }
            </th>
          )}
        </tr>
      </thead>

      <tbody>
        <tr>
          {signoffCols.map(name => {
            const val = data[name]
            return <td key={name}>
              {!val ? <b className="fatal">No</b> : <CheckIcon className="success" />}
            </td>
          })}
        </tr>
      </tbody>
    </SignedTable>
  )
}


function FactoryNotes({data}) {
  const note2 = data[`Phase 2 Note`]
  const note3 = data[`Phase 3 Note`]

  const notes = <ul>
    {note2?.length == 0 && note3?.length == 0 &&
      <span className="muted">No factory notes</span>
    }
    {note2?.length > 0 && <li><b>Phase 2 Note:</b> {note2}</li>}
    {note3?.length > 0 && <li><b>Phase 3 Note:</b> {note3}</li>}
  </ul>

  return <div>
    <h4>Notes</h4>
    {notes}
  </div>
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
  const [sanityData, setSanityData] = useState<BH.ByMetric>(null)

  const [health, setHealth] = useState(null)

  const [loading2, setLoading2] = useState(null)
  const [loading3, setLoading3] = useState(null)

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
        BH.getNodeDeviceHealth(vsn, '-7d')
          .then((data) => setHealth(data))
          .catch((err) => setHealthError(err))
      })


    setLoading2(true)
    const p2 = BH.getSanityChart(node.toLowerCase(), '-7d')
      .then((sanity) => {
        if (!sanity) {
          return
        }

        const data = sanity[node.toLowerCase()][`${node.toLowerCase()}.ws-nxcore`]

        setSanityData(data)
      }).catch((err) => setError2(err))
      .finally(() => setLoading2(false))

    setLoading3(true)
    const p3 = BK.getNode(node)
      .then(data => setMeta(data))
      .catch(err => setError3(err))
      .finally(() => setLoading3(false))

    Promise.all([p2, p3])
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
                const label = startCase(name.replace(/_/g, ' ').replace('camera', ''))
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
        <Charts>
          <h2>Health</h2>
          {health &&
            <TimelineChart
              data={health}
              endTime={ceilingHour(new Date())}
              colorCell={(val, obj) => {
                if (val == null)
                  return color.noValue
                return val == 0 ? color.red4 : color.green
              }}
              tooltip={(item) =>
                `${new Date(item.timestamp).toDateString()} ${new Date(item.timestamp).toLocaleTimeString()}<br>
                ${item.meta.device}<br>
                <b style="color: ${item.value == 0 ? color.red3 : color.green}">
                  ${item.value == 0 ? 'failed' : `success`}
                </b>
                `
              }
              margin={{right: 20}}
              tailHours={72}
            />
          }


          <h2>Sanity Tests</h2>
          {sanityData &&
            <TimelineChart
              data={sanityData}
              endTime={ceilingHour(new Date())}
              yFormat={l => l.split('.').pop()}
              colorCell={sanityColor}
              tooltip={(item) =>
                `${new Date(item.timestamp).toDateString()} ${new Date(item.timestamp).toLocaleTimeString()}<br>
                ${item.row.split('.').pop()}<br>
                <b style="color: ${sanityColor(item.value, item)}">
                  ${item.value == 0 ? 'passed' : (item.meta.severity == 'warning' ? 'warning' : 'failed')}
                </b>
                `
              }
              margin={{right: 20}}
              tailHours={72}
            />
          }

          {!loading2 && !sanityData &&
            <p className="muted">
              <div className="clearfix"></div>
              No sanity data available
            </p>
          }

          {error2 &&
            <Alert severity="error">{error2.message}</Alert>
          }

          {!loading3 && error3 &&
            <Alert severity="error">{error3.message}</Alert>
          }

        </Charts>

        <Data>
          {factoryView && manifest?.factory &&
            <>
              <SignOffTable data={manifest.factory} />
              <FactoryNotes data={manifest.factory} />
            </>
          }
          {vsn && <AllRecentData node={node} vsn={vsn} manifest={manifest} />}
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

  h2 {
    float: left;
  }
`

const Data = styled.div`
  min-width: 400px;
  max-width: 400px;
  margin-left: 2em;
`

