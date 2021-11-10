import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useParams, useLocation } from 'react-router-dom'

import Alert from '@mui/material/Alert'

import * as BH from '../../apis/beehive'
import * as BK from '../../apis/beekeeper'
import * as SES from '../../apis/ses'
import { useProgress } from '../../../components/progress/ProgressProvider'

import TimelineChart, {colors} from '../../viz/TimelineChart'

import RecentData from './RecentData'



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



export default function NodeView() {
  const {node} = useParams()
  const params = new URLSearchParams(useLocation().search)
  const hours = params.get('hours')
  const days = params.get('days')

  const { setLoading } = useProgress()

  const [sanityData, setSanityData] = useState<BH.MetricsObj>(null)

  const [pluginData, setPluginData] = useState<SES.GroupedByPlugin>()

  const [vsn, setVsn] = useState(null)
  const [meta, setMeta] = useState(null)

  const [loading1, setLoading1] = useState(null)
  const [loading2, setLoading2] = useState(null)
  const [loading3, setLoading3] = useState(null)

  const [error1, setError1] = useState(null)
  const [error2, setError2] = useState(null)
  const [error3, setError3] = useState(null)

  useEffect(() => {
    setLoading(true)

    BH.getVSN(node.toLowerCase())
      .then(vsn => setVsn(vsn))

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

      <div className="flex">
        <Charts className="flex column">

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
                 ${item.value == 0 ? 'running' : `not running (${item.meta.status})`}
                `
              }
              margin={{right: 20}}
            />
          }

          {!loading1 && !pluginData &&
            <p className="muted">No (recent) plugin data available</p>
          }

          {error1 &&
            <Alert severity="error">{error1.message}</Alert>
          }

          <h2>Sanity Tests</h2>
          {sanityData &&
            <TimelineChart
              data={sanityData}
              yFormat={l => l.split('.').pop()}
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
                ${item.value == 0 ? 'passed' : (item.meta.severity == 'warning' ? 'warning' : 'failed')}
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

          {!hours && !days &&
            <>
              <h2>Node Details</h2>
              {meta &&
                <table className="key-value-table">
                  <tbody>
                    <tr>
                      <td>Status</td>
                      <td className={meta.status == 'active' ? 'success' : ''}>
                        <b>{meta.status}</b>
                      </td>
                    </tr>

                    {Object.entries(meta)
                      .map(([key, val]) => {
                        const label = key.replace(/_/g, ' ')
                          .replace(/\b[a-z](?=[a-z]{1})/g, c => c.toUpperCase())
                        return <tr key={key}><td>{label}</td><td>{val || '-'}</td></tr>
                      })
                    }

                    {meta.contact &&
                    <>
                      <tr><td colSpan={2}>Contact</td></tr>
                      <tr>
                        <td colSpan={2} style={{fontWeight: 400, paddingLeft: '30px'}}>{data.contact}</td>
                      </tr>
                    </>
                    }
                  </tbody>
                </table>
              }
            </>
          }

          {!loading3 && error3 &&
            <Alert severity="error">{error3.message}</Alert>
          }

        </Charts>

        <Data>
          <RecentData node={node} />
        </Data>

      </div>
    </Root>
  )
}



const Root = styled.div`
  margin: 20px;

  table {
    max-width: 400px;
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
