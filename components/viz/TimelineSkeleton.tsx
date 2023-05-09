import styled from 'styled-components'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'


type Props = {
  includeHeader?: boolean
}

export default function TimeLineSkeleton(props: Props) {
  const {includeHeader} = props

  return (
    <Root>
      <Stack spacing={1}>
        {includeHeader &&
          <div className="flex justify-between">
            <Skeleton width={40} />
            <Skeleton width={200} />
          </div>
        }
        <div className="flex gap">
          <Skeleton width={100} /> <Skeleton width="100%" animation="wave" />
        </div>
        <div className="flex gap">
          <Skeleton width={100} /> <Skeleton width="100%" animation="wave" />
        </div>
        <div className="flex gap">
          <Skeleton width={100} /> <Skeleton width="100%" animation="wave" />
        </div>
        <div className="flex gap">
          <Skeleton width={100} /> <Skeleton width="100%" animation="wave" />
        </div>
      </Stack>
    </Root>
  )
}

const Root = styled.div`
  margin: 20px 10px 0 10px;
`

