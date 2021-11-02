import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components'

import * as BH from '../apis/beehive'

import TimelineChart, {getMetricBins} from '../TimelineChart'


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

  const [data, setData] = useState<MetricsObj>(null)

  const [error, setError] = useState(null)


  useEffect(() => {
    BH.getSanityChart(node.toLowerCase())
      .then((sanity) => {
        const data = sanity[node.toLowerCase()][`${node.toLowerCase()}.ws-nxcore`]

        const d = getDate(hours, days)

        for (const key of Object.keys(data)) {
        // sort all the lists by time and limit by last 2 days
          data[key] = data[key].filter(obj => new Date(obj.timestamp) > d)
        }

        setData(data)
      }).catch((err) => setError(err))

  }, [days, hours])

  return (
    <Root>
      {data &&
        <TimelineChart data={data} />
      }

    </Root>
  )
}

const Root = styled.div`

`

