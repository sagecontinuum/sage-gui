import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useParams, useLocation } from 'react-router-dom'

import Alert from '@mui/material/Alert'

import * as BH from '/components/apis/beehive'
import * as BK from '/components/apis/beekeeper'
import { useProgress } from '/components/progress/ProgressProvider'
import TimelineChart, { color } from '/components/viz/Timeline'
import { Card } from '/components/layout/Layout'

import { endOfHour, subDays } from 'date-fns'

export const LABEL_WIDTH = 200


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


export default function () {
  const vsn = useParams().vsn as BK.VSN
  const params = new URLSearchParams(useLocation().search)

  const hours = params.get('hours')
  const days = params.get('days')

  const {setLoading} = useProgress()

  const [health, setHealth] = useState(null)
  const [sanityData, setSanityData] = useState<BH.ByMetric>(null)

  const [loadingHealth, setLoadingHealth] = useState(null)
  const [loadingSanity, setLoadingSanity] = useState(null)

  const [sanityError, setSanityError] = useState(null)
  const [healthError, setHealthError] = useState(null)


  useEffect(() => {
    setLoading(true)

    setLoadingHealth(true)
    const p1 = BH.getDeviceHealthSummary({vsn, start: '-7d'})
      .then((data) => setHealth(data))
      .catch((err) => setHealthError(err))
      .finally(() => setLoadingHealth(false))

    setLoadingSanity(true)
    const p2 = BH.getSanityData({vsn, start: '-7d'})
      .then((sanity) => {
        if (!sanity) return

        const data = Object.values(Object.values(sanity)[0])[0]

        // ignore failing telegraf cadvisor metric
        delete data['sys.sanity_status.wes_telegraf_cadvisor']

        setSanityData(data)
      }).catch((err) => setSanityError(err))
      .finally(() => setLoadingSanity(false))

    Promise.all([p1, p2])
      .then(() => setLoading(false))
  }, [vsn, setLoading, days, hours])



  return (
    <Root className="gap">
      <Card>
        <h2>Health</h2>
        {health &&
          <TimelineChart
            data={health}
            // same range as the request, but can be modified if needed
            startTime={subDays(new Date(), 7)}
            endTime={endOfHour(new Date())}
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
            labelWidth={LABEL_WIDTH}
          />
        }

        {healthError &&
          <Alert severity="error">{healthError.message}</Alert>
        }

        {!loadingHealth && !health &&
          <p className="muted">
            <div className="clearfix"></div>
            No health data available
          </p>
        }

        <br/>

        <h2>Sanity Tests</h2>
        {sanityData &&
          <TimelineChart
            data={sanityData}
            startTime={subDays(new Date(), 7)}
            endTime={endOfHour(new Date())}
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
            labelWidth={LABEL_WIDTH}
          />
        }

        {sanityError &&
          <Alert severity="error">{sanityError.message}</Alert>
        }

        {!loadingSanity && !sanityData &&
          <p className="muted">
            <div className="clearfix"></div>
            No sanity data available
          </p>
        }
      </Card>
    </Root>
  )
}

const Root = styled.div`
  h2 {
    float: left;
    margin:0;
  }
`


