import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import styled from 'styled-components'
import Tooltip from '@mui/material/Tooltip'

import ConfirmationDialog from '/components/dialogs/ConfirmationDialog'
import TimelineChart, { color } from '/components/viz/Timeline'

import * as BH from '/components/apis/beehive'
import type { PluginEvent, ErrorsByGoalID } from '/components/apis/ses'



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
  errors: ErrorsByGoalID
  start?: string  // show timeline range that is selected?
}

export default function JobTimeLine(props: Props) {
  const {data, errors, start} = props

  const navigate = useNavigate()
  const [selectedEvent, setSelectedEvent] = useState<PluginEvent | false>(false)


  const getErrors = (pluginEvent: PluginEvent) => {
    const {goal_id, k3s_pod_instance} = pluginEvent.value

    const text = (errors[goal_id] || [])
      .filter(obj => obj.value.k3s_pod_instance == k3s_pod_instance)
      .map(obj => obj.value.error_log)

    return text.length == 0 ? 'no errors found' : text
  }

  return (
    <Root>
      {data &&
        <TimelineChart
          data={data}
          startTime={new Date(start)}
          scaleExtent={[.2, 1000]}
          colorCell={(val, obj) => {
            if (obj.status === undefined) return color.noValue
            return colorMap[obj.status]
          }}
          tooltip={(obj) => `
            ${new Date(obj.timestamp).toLocaleString()}
            - ${new Date(obj.end).toLocaleTimeString()}<br>
            <br/>
            <b>goal id:</b> ${obj.value.goal_id}<br>
            <b>image:</b> ${obj.value.plugin_image}<br>
            <b>task:</b> ${obj.value.plugin_task}<br>
            <b>args:</b> ${obj.value.plugin_args}<br>
            <b>selector:</b> ${obj.value.plugin_selector}<br>
            <b>${obj.status == 'running' ? 'status': 'end status'}:</b>
              <b class="${obj.status}">${obj.status}</b><br>
          `}
          yFormat={(label: string, data) => {
            // todo: this is workaround to ensure chart can be updated when y axis changes(?)
            if (!data[label]) return

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
            // show errors for red boxes
            if (data.status == 'failed') {
              setSelectedEvent(data)
              return
            }

            const {value, meta, timestamp, end} = data
            const image = value.plugin_image
            const {vsn} = meta
            const app = image.slice(image.lastIndexOf('/') + 1)
            navigate(`/query-browser/?apps=.*${app}&nodes=${vsn}&start=${timestamp}&end=${end}`)
          }}
          labelWidth={175}
          tooltipPos="top"
        />
      }

      {selectedEvent &&
        <ConfirmationDialog
          title="Errors"
          onClose={() => setSelectedEvent(false)}
          onConfirm={() => setSelectedEvent(false)}
          content={<pre>{getErrors(selectedEvent)}</pre>}
          maxWidth="65%"
        />
      }
    </Root>
  )
}

const Root = styled.div`

`
