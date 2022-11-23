
import styled from 'styled-components'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'



export default function TimeLineSkeleton() {

  return (
    <Root>
      <Stack spacing={1}>
        <div className="flex justify-between">
          <Skeleton width={40} />
          <Skeleton width={200} />
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
  margin: 40px 10px;
`

