import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useProgress } from '/components/progress/ProgressProvider'

import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'

import Table from '/components/table/Table'
import * as User from '/components/apis/user'
import ErrorMsg from '../ErrorMsg'


const columns = [{
  id: 'vsn',
  label: 'VSN',
  format: vsn => <Link to={`/nodes/${vsn}`}>{vsn}</Link>
}, {
  id: 'schedule',
  label: 'Can schedule?',
  format: (yes) => yes ? <CheckCircleRounded className="success" />  : 'no'

}, {
  id: 'develop',
  label: 'Can develop?',
  format: (yes) => yes ? <CheckCircleRounded className="success" /> : 'no'
}]


export default function MyNodes() {
  const {setLoading} = useProgress()

  const [data, setData] = useState<User.MyNode[]>()
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    User.listMyNodes()
      .then(data => setData(data))
      .catch(error => setError(error))
      .finally(() => setLoading(false))
  }, [setLoading])

  return (
    <Root>
      <h1 className="no-margin">My Nodes</h1>
      {data &&
        <Table
          primaryKey="vsn"
          enableSorting
          columns={columns}
          rows={data}
        />
      }

      {error &&
        <ErrorMsg>{error.message}</ErrorMsg>
      }
    </Root>
  )
}

const Root = styled.div`

`
