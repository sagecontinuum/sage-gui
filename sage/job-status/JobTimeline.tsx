import styled from 'styled-components'
import TimelineChart, {colors} from '../../admin-ui/viz/TimelineChart'
import {GroupedApps} from './JobStatus'


type Props = {
  data: GroupedApps
}

export default function JobTimeLine(props: Props) {
  const {data} = props

  return (
    <Root>
      {data &&
        <TimelineChart
          data={data}
          colorCell={(val, obj) => {
            if (obj.status === undefined) return colors.noValue
            return obj.status == 'complete' ? colors.green4 : colors.red4
          }}
          tooltip={(obj) => `
            ${new Date(obj.timestamp).toLocaleString()} - ${new Date(obj.end).toLocaleTimeString()}<br>
            ${obj.value}<br>
            start status: ${obj.name.split('.').pop()}<br>
            end status: ${obj.status}<br>
            <br>
            <code>${JSON.stringify(obj.meta, null, 4).replace(/,/g, '<br>').replace(/\{|\}|"/g, '')}</code>
          `}
          onRowClick={(val, data) => console.log('row click', val, data)}
          onCellClick={(data) => console.log('cell click', data)}
          margin={{
            right: 0
          }}
        />
      }
    </Root>
  )
}

const Root = styled.div`

`
