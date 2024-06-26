import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useProgress } from '/components/progress/ProgressProvider'

import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'

import Table from '/components/table/Table'
import * as User from '/components/apis/user'
import * as BK from '/components/apis/beekeeper'
import ErrorMsg from '../../apps/sage/ErrorMsg'

import config from '/config'
const { contactUs } = config


const columns = [{
  id: 'vsn',
  label: <>Node (VSN)</>,
  format: (vsn, obj) => <Link to={`/node/${obj.vsn}`}>{vsn}</Link>
}, {
  id: 'schedule',
  label: 'Can schedule?',
  format: (yes) => yes ? <CheckCircleRounded className="success" />  : 'no'

}, {
  id: 'develop',
  label: 'Shell access?',
  format: (yes) => yes ? <CheckCircleRounded className="success" /> : 'no'
}]


export default function MyNodes() {
  const {setLoading} = useProgress()

  const [data, setData] = useState<User.MyNode[]>()
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)

    Promise.all([User.listMyNodes(), BK.getNodeDict()])
      .then(([myNodes, nodeDict]) =>  setData(myNodes.map(o => ({...o, ...nodeDict[o.vsn]}))))
      .catch(error => setError(error))
      .finally(() => setLoading(false))

  }, [setLoading])

  return (
    <Root>
      <h1 className="no-margin">My Node Privileges</h1>
      <br/>
      {data &&
        <Table
          primaryKey="vsn"
          enableSorting
          columns={columns}
          rows={data}
          emptyNotice={<div>
            Sorry, you do not have access to any nodes.<br/>
            Please <b><a href={contactUs}>contact us</a></b> if
            interested in collaborating with Sage.
          </div>}
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
