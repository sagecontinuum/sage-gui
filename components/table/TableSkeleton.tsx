import styled from 'styled-components'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'


export default function TableSkeleton() {

  return (
    <Root>
      <Stack spacing={2}>
        <div className="flex justify-between">
          <Skeleton width={250} animation="wave" />
          <Skeleton width={15} animation="wave" />
        </div>
        {[...Array(20).keys()].map((key) =>
          <div className="flex gap" key={key}>
            <Skeleton width="100%" animation="wave" />
            <Skeleton width="100%" animation="wave" />
            <Skeleton width="100%" animation="wave" />
            <Skeleton width="100%" animation="wave" />
            <Skeleton width="100%" animation="wave" />
            <Skeleton width="100%" animation="wave" />
            <Skeleton width="100%" animation="wave" />
          </div>
        )}
      </Stack>
    </Root>
  )
}

const Root = styled.div`
  margin: 40px 10px;
`

