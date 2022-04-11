
import styled from 'styled-components'

import RecentDataTable from './RecentDataTable'
import RecentImages from './RecentImages'
import Audio from '/components/viz/Audio'

import type {Manifest} from '/components/apis/beekeeper'


type Props = {
  node: string
  manifest: Manifest
}

export default function RecentData(props: Props) {
  const {node, manifest} = props

  return (
    <Root className="flex column">

      <h2>Recent Data</h2>
      <RecentDataTable
        items={[{
          label: 'Temperature',
          query: {
            node: node.toLowerCase(),
            name: 'env.temperature',
            sensor: 'bme680'
          },
          format: v => `${v}°C`,
          linkParams: (data) => `apps=${data.meta.plugin}&nodes=${data.meta.vsn}&names=${data.name}&window=d`
        }, {
          label: 'Raingauge',
          query: {
            node: node.toLowerCase(),
            name: 'env.raingauge.event_acc'
          },
          linkParams: (data) => `apps=${data.meta.plugin}&nodes=${data.meta.vsn}&names=${data.name}&window=d`
        }]}
      />

      <h2>Recent Images</h2>
      <RecentImages node={node}/>

      <h2>Recent Audio</h2>
      <Audio node={node} />
      {manifest?.shield === false &&
        <p className="muted">This node does not support audio</p>
      }
    </Root>
  )
}

const Root = styled.div`
  img {
    max-width: 100%;
    margin: 1px;
  }
`
