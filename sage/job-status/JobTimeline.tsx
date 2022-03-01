import {useHistory} from 'react-router-dom'
import styled from 'styled-components'
import TimelineChart, {colors} from '../../admin-ui/viz/TimelineChart'
import {GroupedApps} from './JobStatus'


const formatJSON = (data) =>
  JSON.stringify(data, null, 4).replace(/,/g, '<br>').replace(/\{|\}|Meta"/g, '')

const colorMap = {
  'complete': colors.green4,
  'failed': 'rgb(180, 0, 0, 0.5)',
  'running': 'rgb(235, 172, 101)',
  undefined: colors.noValue
}

type Props = {
  data: GroupedApps
}

export default function JobTimeLine(props: Props) {
  const history = useHistory()

  const {data} = props

  return (
    <Root>
      {data &&
        <TimelineChart
          data={data}
          colorCell={(val, obj) => {
            if (obj.status === undefined) return colors.noValue
            return colorMap[obj.status]
          }}
          tooltip={(obj) => `
            ${new Date(obj.timestamp).toLocaleString()} - ${new Date(obj.end).toLocaleTimeString()}<br>
            ${formatJSON(obj.value)}<br>
            start status: ${obj.name.split('.').pop()}<br>
            end status: ${obj.status}<br>
            <br>
            <code>${formatJSON(obj.meta)}</code>
          `}
          onRowClick={(val, data) => {
            const image = data[0].value.plugin_image
            const app = image.slice(image.lastIndexOf('/') + 1)
            history.push(`/data-browser/?apps=${app}`)
          }}
          onCellClick={(data) => console.log('cell click', data)}
          margin={{right: 0, bottom: 0}}
        />
      }
    </Root>
  )
}

const Root = styled.div`

`
