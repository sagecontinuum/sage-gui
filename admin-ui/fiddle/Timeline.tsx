import React, { useEffect, useState } from 'react'
import { useLocation, Link} from 'react-router-dom'
import styled from 'styled-components'

import * as BH from '../apis/beehive'

import TimelineChart from '../TimelineChart'


const node = '000048B02D05A0A4'



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


type Props = {

}

export default function Timeline(props: Props) {
  const params = new URLSearchParams(useLocation().search)
  const hours = params.get('hours')
  const days = params.get('days')

  const [data1, setData1] = useState<MetricsObj>(null)
  const [data2, setData2] = useState<MetricsObj>(null)

  const [error1, setError1] = useState(null)
  const [error2, setError2] = useState(null)


  useEffect(() => {

    // test one: influx aggregated data
    BH.getDailyChart(node.toLowerCase())
      .then((data) => {
        console.log('data', data)
        setData1(data)
      }).catch((err) => setError2(err))


    // test two: node sanity data
    BH.getSanityChart(node.toLowerCase(), '-7d')
      .then((sanity) => {
        const data = sanity[node.toLowerCase()][`${node.toLowerCase()}.ws-nxcore`]
        setData2(data)
      }).catch((err) => setError1(err))


  }, [days, hours])

  return (
    <Root>
      <h2>Nodes</h2>
      {data1 &&
        <TimelineChart
          data={data1}
          days={30}
        />
      }

      {data2 && <h2>Node <Link to={`/node/${node}`}>{node}</Link></h2>}
      {data2 &&
        <TimelineChart
          data={data2}
          yFormat={l => l.split('.').pop()}
          days={2}
        />
      }

    </Root>
  )
}

const Root = styled.div`

`

