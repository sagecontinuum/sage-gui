import styled from 'styled-components'
import { Card } from '/components/layout/Layout'

const TimelineContainer = styled(Card)`
  margin: 25px 0;

  .title-row {
    float: left;
    width: 100%; /* required to expand container for timeline viz */

    h2 {
      margin: 0;
    }
  }
`

export default TimelineContainer