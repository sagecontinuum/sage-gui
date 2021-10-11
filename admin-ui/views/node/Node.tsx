import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useParams } from 'react-router-dom'

import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

import * as BH from '../../apis/beehive'
import * as BK from '../../apis/beekeeper'
import * as SES from '../../apis/ses'
import { useProgress } from '../../../components/progress/ProgressProvider'

import SanityChart, {getMetricBins, colorMap} from '../../SanityChart'

import LatestData from './LatestData'


type MetricsObj = {
  [metric: string]: BH.Record[]
}


export default function NodeView() {
  const {node} = useParams()

  const { setLoading } = useProgress()

  const [loadingTests, setLoadingTests] = useState(true)

  const [chartData, setChartData] = useState<MetricsObj>(null)
  const [bins, setBins] = useState<Date[]>(null)

  const [pluginData, setPluginData] = useState<SES.GroupedByPlugin>()
  const [pluginBins, setPluginBins] = useState<Date[]>(null)

  const [vsn, setVsn] = useState(null)
  const [meta, setMeta] = useState(null)

  const [error, setError] = useState(null)

  useEffect(() => {
    BK.getNode(node)
      .then(data => setMeta(data))
      .catch(error => setError(error))

    // todo(nc): to be replaced by entry in beekeeper?
    BH.getVSN(node.toLowerCase())
      .then(vsn => setVsn(vsn))
      .catch(error => setError(error))

    setLoading(true)

    setLoadingTests(true)
    BH.getSanityChart(node.toLowerCase())
      .then((data) => {
        const d = data[node.toLowerCase()][`${node.toLowerCase()}.ws-nxcore`]
        const bins = getMetricBins(Object.values(d))
        setBins(bins)
        setChartData(d)
      }).finally(() => setLoadingTests(false))

    SES.getGroupedByPlugin(node)
      .then((data) => {
        var d = new Date()
        d.setDate(d.getDate() - 2)

        for (const key of Object.keys(data)) {
          // sort all the lists by time and limit by last 2 days
          data[key] = data[key].sort((a, b) =>
            +new Date(a.timestamp) - +new Date(b.timestamp)
          ).filter(obj => new Date(obj.timestamp) > d)

          // exclude empty lists (for now)
          if (data[key].length == 0)
            delete data[key]
        }

        const pluginBins = getMetricBins(Object.values(data))
        setPluginBins(pluginBins)
        setPluginData(data)
      }).catch(() => {
        setLoading(false)
        setPluginData(null)
      }).finally(() => {
        setLoading(false)
      })
  }, [node, setLoading])


  return (
    <Root>
      <h1>
        Node {vsn} | <small className="muted">{node}</small>
      </h1>

      <div className="flex">
        <Charts className="flex column">

          <h2>Plugins</h2>
          {pluginData &&
          <SanityChart
            data={pluginData}
            bins={pluginBins}
            colorForValue={(val, obj) => {
              if (val == null)
                return colorMap.noValue

              if (val <= 0)
                return colorMap.green3
              else if (obj.meta.severity == 'warning')
                return colorMap.orange1
              else
                return colorMap.red4
            }}
            tooltip={(item) =>
              <div>
                {new Date(item.timestamp).toLocaleTimeString()}<br/>
                {item.value == 0 ? 'running' : `not running (${item.meta.status})`}
              </div>
            }
          />
          }
          {pluginData == null &&
            <span className="muted">No plugin data available</span>
          }

          <br/>

          <h2 className="no-margin">Sanity Tests</h2>
          {loadingTests && <CircularProgress/>}
          {chartData &&
          <SanityChart
            data={chartData}
            bins={bins}
            colorForValue={(val, obj) => {
              if (val == null)
                return colorMap.noValue

              if (val <= 0)
                return colorMap.green3
              else if (obj.meta.severity == 'warning')
                return colorMap.orange1
              else
                return colorMap.red4
            }}
            tooltip={(item) =>
              <div>
                {new Date(item.timestamp).toLocaleTimeString()}<br/>
                {item.value == 0 ? 'passed' : (item.meta.severity == 'warning' ? 'warning' : 'failed')}
              </div>
            }
          />
          }

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

          {error &&
            <Alert severity="error">{error.message}</Alert>
          }

        </Charts>


        <Data>
          <LatestData node={node} />
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
`

const Charts = styled.div`
  max-width: 925px;
  margin-bottom: 50px;
`

const Data = styled.div`
  flex-grow: 1;
  margin-left: 2em;

`
