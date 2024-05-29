import styled from 'styled-components'
import Clipboard from '/components/utils/Clipboard'

import * as formatters from '/components/views/nodes/nodeFormatters'


type Props = {
  data: {
    lat: number
    lng: number
    hasStaticGPS?: boolean
    hasLiveGPS?: boolean
  }
}

const GpsClipboard = (props: Props) => {
  const {data} = props
  return (
    <Root>
      <Clipboard content={formatters.gps(null, data, true)} tooltip="Copy coordinates" />
    </Root>
  )
}


const Root = styled.div`
  display: inline-block;

  .gps-icon {
    margin-right: 1em;
  }

  pre {
    margin-bottom: 0;
    padding-right: 30px;
  }

  .clipboard-content {
    // less padding since scroll not needed
    padding-bottom: 8px;
  }
`

export default GpsClipboard