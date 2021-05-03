import React, { useCallback, useEffect, useState } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import IconButton from '@material-ui/core/IconButton'
import ViewComfyIcom from '@material-ui/icons/ViewComfy'
import SpaciousIcon from '@material-ui/icons/ViewStream'

import Button from '@material-ui/core/Button'
import AddIcon from '@material-ui/icons/AddRounded'
import Divider from '@material-ui/core/Divider'

import ErrorMsg from '../ErrorMsg'

import BeeIcon from 'url:../../assets/bee.svg'

import Table from '../../components/table/Table'
import TableSearch from '../../components/table/TableSearch'
import { useProgress } from '../../components/progress/Progress'
import * as ECR from '../apis/ecr'

import SpaciousLayout from './SpaciousLayout'
import { formatters } from './formatters'

const columns = [
  {
    id: 'name',
    label: 'Name',
    format: formatters.name
  }, {
    id: 'namespace',
    label: 'Namespace'
  }, {
    id: 'versions',
    label: 'Versions',
    format: formatters.versions
  }, {
    id: 'owner_id',
    label: 'Owner'
  }, {
    id: 'repo',
    label: 'Repo',
    format: formatters.repo
  }, {
    id: 'time_last_updated',
    label: 'Last Update',
    format: formatters.time
  }
]


const queryData = (data: object[], query: string) => {
  return data.filter(row =>
    Object.values(row)
      .join('').toLowerCase()
      .includes(query.toLowerCase())
  )
}

const useParams = () =>
  new URLSearchParams(useLocation().search)


type Row = {
  [key: string]: any
}


type Props = {
  view: 'explore' | 'sharedWithMe' | 'myApps'
}

export default function AppList(props: Props) {
  const params = useParams()
  const history = useHistory()

  const query = params.get('query') || ''

  const [view, setView] = useState(props.view)

  const {loading, setLoading} = useProgress()
  const [data, setData] = useState<Row[]>()
  const [rows, setRows] = useState<Row[]>()
  const [error, setError] = useState(null)

  const [viewStyle, setViewStyle] = useState<'compact' | 'spacious'>('spacious')

  useEffect(() => {
    setView(props.view)
  }, [props.view])

  const listApps = useCallback(() => {
    const opts = view == 'explore' ? 'public' : 'mine'
    return ECR.listApps(opts)
      .then(data => setData(data))
      .catch(error => setError(error.message))
      .finally(() => setLoading(false))
  }, [setData, setError, setLoading, view])

  useEffect(() => {
    setLoading(true)
    if (['sharedWithMe'].includes(view)) {
      // todo(nc): implement
      setData([])
      setLoading(false)
      return
    } else {
      listApps()
    }
  }, [view, listApps, setLoading])


  useEffect(() => {
    if (!data) return

    setRows(queryData(data, query))
  }, [query, data])


  // todo: refactor into useContext or table componnent?
  const onSearch = ({query}) => {
    if (query) params.set('query', query)
    else params.delete('query')
    history.push({search: params.toString()})
  }

  const handleActionComplete = () => {
    setLoading(true)
    listApps()
  }


  return (
    <Root>
      <Controls className="flex items-center justify-between">
        <div>
          <TableSearch
            onSearch={onSearch}
            width="300px"
          />
        </div>


        <div className="flex">
          {view !== 'explore' &&
            <>
              <Button
                component={Link}
                to="/apps/create-app"
                variant="contained"
                color="primary"
                startIcon={<AddIcon/>}
                size="small"
                fullWidth
              >
                Create app
              </Button>

              <Divider orientation="vertical" style={{margin: '0 8px 0 5px'}} flexItem />
            </>
          }

          <IconButton
            onClick={() => setViewStyle('compact')}
            style={{color: viewStyle == 'compact' ? '#000' : '#ccc'}}
            size="small"
          >
            <ViewComfyIcom />
          </IconButton>
          <IconButton
            onClick={() => setViewStyle('spacious')}
            style={{color: viewStyle == 'spacious' ? '#000' : '#ccc'}}
            size="small"
          >
            <SpaciousIcon />
          </IconButton>
        </div>
      </Controls>


      {rows && viewStyle == 'compact' &&
        <Table
          primaryKey="id"
          enableSorting
          columns={columns}
          rows={rows}
        />
      }

      {rows && viewStyle == 'spacious' &&
        <SpaciousLayout
          rows={rows}
          onComplete={handleActionComplete}
        />
      }

      {error &&
        <ErrorMsg>{error}</ErrorMsg>
      }


      {!loading && view == 'myApps' && data?.length == 0 &&
        <NoneFound className="flex column items-center justify-center muted">
          <img src={BeeIcon} />
          <p>You don&apos;t have any apps yet.  Try <Link to="/apps/create-app">creating one</Link>.</p>
        </NoneFound>
      }

      {!loading && view == 'sharedWithMe' && data?.length == 0 &&
        <NoneFound className="flex column items-center justify-center muted">
          <img src={BeeIcon} />
          <p>no apps are shared with you</p>
        </NoneFound>
      }
    </Root>
  )
}

const Root = styled.div`

`

const Controls = styled.div`
  .MuiButton-root,
  .MuiFormControlLabel-root {
    margin: 0 10px;
  }

`

const NoneFound = styled.div`
  font-size: 2.0em;
  padding-top: 100px;

  img {
    width: 175px;
    margin-right: 20px;
    filter: drop-shadow(0px 0px 0.3rem #ccc);
  }
`

const NewApp = styled.div`

`


