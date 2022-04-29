
import styled from 'styled-components'

import RecentDataTable from './RecentDataTable'
import RecentImages from './RecentImages'
import Audio from '/components/viz/Audio'
import format from '/components/data/dataFormatter'

import type {Manifest} from '/components/apis/beekeeper'


type Props = {
  node: string
  vsn: string
  manifest: Manifest

  noData?: boolean
  noImages?: boolean
  noAudio?: boolean
}

export default function RecentData(props: Props) {
  const {node, vsn, manifest} = props

  return (
    <Root className="flex column">
      {!props.noData &&
        <>
          <h2>Recent Data</h2>
          <RecentDataTable
            items={format(['temp', 'raingauge'], vsn)}
          />
        </>
      }

      {!props.noImages &&
        <>
          <h2>Recent Images</h2>
          <RecentImages node={node}/>
        </>
      }

      {!props.noAudio &&
        <>
          <h2>Recent Audio</h2>
          <Audio node={node} />
          {manifest?.shield === false &&
            <p className="muted">This node does not support audio</p>
          }
        </>
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
