import styled from 'styled-components'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'

type Props = {
  noSearch?: boolean
  rows?: number
}

export default function TableSkeleton(props: Props) {
  const {noSearch, rows = 20} = props

  return (
    <Root>
      <Stack spacing={2}>
        {!noSearch &&
          <div className="flex justify-between">
            <Skeleton width={250} animation="wave" />
            <Skeleton width={15} animation="wave" />
          </div>
        }
        {[...Array(rows).keys()].map((key) =>
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
  margin: 40px 10px 20px 10px;
`

