/* eslint-disable react/display-name */
import React, { useCallback, useEffect, useState } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import IconButton from '@material-ui/core/IconButton'
import ViewComfyIcom from '@material-ui/icons/ViewComfy'
import SpaciousIcon from '@material-ui/icons/ViewStream'
import GithubIcon from '@material-ui/icons/GitHub'
import Tooltip from '@material-ui/core/Tooltip'
import ErrorMsg from '../ErrorMsg'

import BeeIcon from 'url:../../assets/bee.svg'

import Table from '../../components/table/Table'
import TableSearch from '../../components/table/TableSearch'
import * as utils from '../../components/utils/units'
import { useProgress } from '../../components/progress/Progress'
import * as ECR from '../apis/ecr'

import SpaciousLayout from './SpaciousLayout'


type VerTooltipProps = {
  versions: {version: string}[]
}

export function VersionTooltip(props: VerTooltipProps) {
  const {versions} = props

  return (
    <Tooltip
      arrow
      title={
        <>
          <div>Versions:</div>
          {versions.map(ver => <div key={ver}>{ver}</div>)}
        </>
      }
    >
      <a>{versions.length} version{versions.length > 1 ? 's' : ''}</a>
    </Tooltip>
  )
}


export const formatters = {
  name: (name, o) => {
    return <Link to={`app/${o.namespace}/${name}/${o.version}`}>{name}</Link>
  },
  versions: (versions) => {
    if (!versions?.length) return '-'

    return (
      <>
        {versions[versions?.length - 1].version}{' '}
        <VersionTooltip versions={versions}/>
      </>
    )
  },
  repo: (_, {source}) => {
    const {url} = source

    if (!url) return <></>

    return (
      <a href={url} target="_blank" rel="noreferrer" className="flex items-center">
        <GithubIcon fontSize="small" className="text-color" />&nbsp;
        {url.slice(url.lastIndexOf('/') + 1).replace('.git', '')}
      </a>
    )
  },
  time: val => {
    return utils.msToTimeApprox(Date.now() - new Date(val).getTime())
  }
}


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

  const listApps = useCallback((onlyPublic = false) => {
    return ECR.listApps(onlyPublic)
      .then(data => setData(data))
      .catch(error => setError(error.message))
      .finally(() => setLoading(false))
  }, [setData, setError, setLoading])

  useEffect(() => {
    setLoading(true)
    if (['sharedWithMe'].includes(view)) {
      // todo(nc): implement
      setData([])
      setLoading(false)
      return
    } else if (view == 'explore') {
      listApps(true)
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
      <Controls>
        <TableSearch
          onSearch={onSearch}
          width="300px"
        />

        <div>
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
  display: flex;
  align-items: center;

  .MuiButton-root,
  .MuiFormControlLabel-root {
    margin: 0 10px;
  }

  & :last-child {
    margin-left: auto;
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

