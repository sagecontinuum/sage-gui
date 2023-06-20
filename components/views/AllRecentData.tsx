import styled from 'styled-components'

import RecentDataTable from './RecentDataTable'
import RecentImages from './RecentImages'
import Audio from '/components/viz/Audio'
import format from '/components/data/dataFormatter'

import type {NodeMeta, VSN} from '/components/apis/beekeeper'


type Props = {
  vsn: VSN
  nodeMeta: NodeMeta

  noData?: boolean
  noImages?: boolean
  noAudio?: boolean
}

export default function RecentData(props: Props) {
  const {vsn, nodeMeta} = props

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
          <RecentImages vsn={vsn}/>
        </>
      }

      {!props.noAudio &&
        <>
          <h2>Recent Audio</h2>
          <Audio vsn={vsn} />
          {nodeMeta?.shield === false &&
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
