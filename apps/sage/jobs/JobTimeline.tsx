import { useNavigate, Link } from 'react-router-dom'
import styled from 'styled-components'
import { subHours } from 'date-fns'

import TimelineChart, {color} from '/components/viz/Timeline'

import * as BH from '/components/apis/beehive'
import Tooltip from '@mui/material/Tooltip'



const formatJSON = (data) =>
  JSON.stringify(data, null, 4).replace(/,/g, '<br>').replace(/\{|\}|Meta"/g, '')

const colorMap = {
  complete: color.green4,
  failed: color.red4,
  running: 'rgb(235, 172, 101, .6)',
  undefined: color.noValue
}


type GroupedApps = {
  [app: string]: (
    BH.Record &
    {
      status: 'launched' | 'running' | 'complete' | 'failed'
      runtime: string
    }
  )[]
}


type Props = {
  data: GroupedApps
}

export default function JobTimeLine(props: Props) {
  const navigate = useNavigate()

  const {data} = props

  return (
    <Root>
      {data &&
        <TimelineChart
          data={data}
          startTime={subHours(new Date(), 24)}
          endTime={new Date()}
          scaleExtent={[.2, 1000]}
          colorCell={(val, obj) => {
            if (obj.status === undefined) return color.noValue
            return colorMap[obj.status]
          }}
          tooltip={(obj) => `
            ${new Date(obj.timestamp).toLocaleString()}
            - ${new Date(obj.end).toLocaleTimeString()}<br>

            goal id: ${obj.value.goal_id}<br>
            image: ${obj.value.plugin_image}<br>
            task: ${obj.value.plugin_task}<br>
            args: ${obj.value.plugin_args}<br>
            selector: ${obj.value.plugin_selector}<br>
            start status: ${obj.name.split('.').pop()}<br>
            end status: ${obj.status}<br>
            <br>
            <code>${formatJSON(obj.meta)}</code>
          `}
          yFormat={(label: string, data) => {
            // just form label from first entry
            const l = data[label][0].value.plugin_image
            const path = l.replace('registry.sagecontinuum.org/', '').split(':')[0]

            return (
              <Tooltip title={<>{path}<br/>(click for details)</>} placement="right">
                <Link to={`/apps/app/${path}`} key={label}>
                  {label}
                </Link>
              </Tooltip>
            )
          }}
          onCellClick={(data) => {
            const {value, meta} = data
            const image = value.plugin_image
            const node = meta.vsn
            const app = image.slice(image.lastIndexOf('/') + 1)
            navigate(`/query-browser/?apps=.*${app}&nodes=${node}&window=d`)
          }}
          margin={{left: 175, right: 0, bottom: 0}}
          tooltipPos="top"
        />
      }
    </Root>
  )
}

const Root = styled.div`

`
