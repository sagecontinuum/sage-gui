import { useEffect, useState } from 'react'
import { useLocation, Link} from 'react-router-dom'
import styled from 'styled-components'
import Alert from '@mui/material/Alert'

import * as BH from '/components/apis/beehive'

import TimelineChart, {color} from '/components/viz/Timeline'


const vsn = 'W021'


export default function Timeline() {
  const params = new URLSearchParams(useLocation().search)
  const hours = params.get('hours')
  const days = params.get('days')

  const [data1, setData1] = useState<BH.ByMetric>(null)
  const [data2, setData2] = useState<BH.ByMetric>(null)

  const [error1, setError1] = useState(null)
  const [error2, setError2] = useState(null)


  useEffect(() => {

    // test one: influx aggregated data
    BH.getSanitySummary()
      .then((data) => setData1(data))
      .catch((err) => setError2(err))


    // test two: node sanity data
    BH.getSanityData({vsn, start: '-7d'})
      .then((sanity) => {
        const data = Object.values(Object.values(sanity)[0])[0]
        setData2(data)
      }).catch((err) => setError1(err))
  }, [days, hours])

  return (
    <Root>
      <h2>Nodes</h2>
      {data1 &&
        <TimelineChart
          data={data1}
          tooltip={(item) =>
            `${new Date(item.timestamp).toDateString()} ${new Date(item.timestamp).toLocaleTimeString()}<br>
            ${item.value == 0 ? 'passed' : (item.meta.severity == 'warning' ? 'warning' : 'failed')}<br>
            value: ${item.value}`
          }
          onRowClick={(val, data) => console.log('row click', val, data)}
          onCellClick={(data) => console.log('cell click', data)}
        />
      }
      {error1 &&
        <Alert severity="error">{error1.message}</Alert>
      }


      {data2 && <h2>Node <Link to={`/node/${vsn}`}>{vsn}</Link></h2>}
      {data2 &&
        <TimelineChart
          data={data2}
          yFormat={l => l.split('.').pop()}
          colorCell={(val, obj) => {
            if (val == null)
              return color.noValue

            if (val <= 0)
              return color.green
            else if (obj.meta.severity == 'warning')
              return color.orange
            else
              return color.red4
          }}
          tooltip={(item) =>
            `${new Date(item.timestamp).toDateString()} ${new Date(item.timestamp).toLocaleTimeString()}<br>
            ${item.value == 0 ? 'passed' : (item.meta.severity == 'warning' ? 'warning' : 'failed')}
            `
          }
          onRowClick={(val, data) => console.log('row click', val, data)}
          onCellClick={(data) => console.log('cell click', data)}
        />
      }
      {error2 &&
        <Alert severity="error">{error2.message}</Alert>
      }

    </Root>
  )
}

const Root = styled.div`
  margin: 2rem auto;
  width: 80%;
`

