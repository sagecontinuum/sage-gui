import React, { useCallback, useEffect, useState, useRef } from 'react'
import { useLocation, useHistory, useRouteMatch } from 'react-router-dom'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import Button from '@material-ui/core/Button'
import AddIcon from '@material-ui/icons/AddRounded'
import Divider from '@material-ui/core/Divider'

import BeeIcon from 'url:../../../assets/bee.svg'

import ErrorMsg from '../../ErrorMsg'
import Table from '../../../components/table/Table'
import TableSearch from '../../../components/table/TableSearch'
import { useProgress } from '../../../components/progress/ProgressProvider'
import * as ECR from '../../apis/ecr'

import {Top} from '../../common/Layout'
import SpaciousLayout from './SpaciousAppList'
import { formatters } from '../formatters'
import LayoutToggle from '../../common/LayoutToggle'

import useWithBuildStatus from '../hooks/useWithBuildStatus'

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
    label: 'Tags',
    format: formatters.versions
  }, {
    id: 'owner',
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


const queryData = (data: any[], query: string) => {
  return data.filter(row =>
    Object.values(row)
      .join('').toLowerCase()
      .includes(query.toLowerCase())
  )
}

const useQueryParams = () =>
  new URLSearchParams(useLocation().search)




export default function AppList() {
  const params = useQueryParams()
  let { path } = useRouteMatch()
  const view = path.split('/')[2]

  const history = useHistory()

  const query = params.get('query') || ''

  const ref = useRef<boolean>()
  const {loading, setLoading} = useProgress()

  let [data, setData] = useWithBuildStatus<ECR.AppDetails[]>()
  const [rows, setRows] = useState<ECR.AppDetails[]>()
  const [error, setError] = useState(null)

  const [viewStyle, setViewStyle] = useState<'compact' | 'spacious'>('spacious')


  const listApps = useCallback(() => {
    const opts = view == 'explore' ? 'public' : 'mine'
    ECR.listApps(opts)
      .then(data => {
        if (!ref.current) return
        setData(data)
      }).catch(error => setError(error.message))
      .finally(() => {
        if (!ref.current) return
        setLoading(false)
      })
  }, [setLoading, view])


  useEffect(() => {
    ref.current = true
    setLoading(true)

    if (['shared-with-me'].includes(view)) {
      // todo(nc): implement
      setData([])
      setLoading(false)
      return
    }

    listApps()

    return () => {
      ref.current = false
    }
  }, [view, setLoading, listApps])


  // effect for queries
  useEffect(() => {
    if (!data) return

    setRows(queryData(data, query))
  }, [view, query, data])



  // todo: refactor into useContext or table componnent?
  const onSearch = ({query}) => {
    if (query) params.set('query', query)
    else params.delete('query')
    history.push({search: params.toString()})
  }

  const onActionComplete = () => {
    setLoading(true)
    listApps()
  }


  const onNavigate = (path: string) => {
    history.push(path)
  }


  return (
    <Root>
      <Top top="0">
        <Controls className="flex items-center justify-between">
          <TableSearch
            onSearch={onSearch}
            width="300px"
          />

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

            <LayoutToggle
              layout={viewStyle}
              onClick={view => setViewStyle(view)}
            />
          </div>
        </Controls>
      </Top>


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
          view={view}
          onComplete={onActionComplete}
          onNavigate={onNavigate}
        />
      }

      {error &&
        <ErrorMsg>{error}</ErrorMsg>
      }


      {!loading && view == 'my-apps' && data?.length == 0 &&
        <NoneFound className="flex column items-center justify-center muted">
          <img src={BeeIcon} />
          <p>You don&apos;t have any apps yet.  Try <Link to="/apps/create-app">creating one</Link>.</p>
        </NoneFound>
      }

      {!loading && view == 'shared-with-me' && data?.length == 0 &&
        <NoneFound className="flex column items-center justify-center muted">
          <img src={BeeIcon} />
          <span>No apps are shared with you</span>
          <small>(sharing is not fully implemented)</small>
        </NoneFound>
      }
    </Root>
  )
}


const Root = styled.div`
  position: relative;
`

const Controls = styled.div`
  background-color: #fff;

  padding: 10px 0;
  border-bottom: 1px solid #ddd;

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

