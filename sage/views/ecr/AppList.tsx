/* eslint-disable react/display-name */
import React, { useEffect, useState } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import FormControlLabel from '@material-ui/core/FormControlLabel'
import Button from '@material-ui/core/Button'
import IconButton from '@material-ui/core/IconButton'
import Checkbox from '@material-ui/core/Checkbox'
import AddIcon from '@material-ui/icons/AddRounded'
import ViewComfyIcom from '@material-ui/icons/ViewComfy'
import SpaciousIcon from '@material-ui/icons/ViewStream'
import GithubIcon from '@material-ui/icons/GitHub'
import Alert from '@material-ui/lab/Alert'


import Table from '../../../components/table/Table'
import TableSearch from '../../../components/table/TableSearch'

import FancyLayout from './FancyLayout'

import * as ECR from '../../api/ecr'


const columns = [
  {id: 'name', label: 'Name',
    format: (name, o) => <Link to={`app/${o.namespace}/${name}/${o.version}`}>{name}</Link>
  },
  {id: 'namespace', label: 'Namespace'},
  {id: 'version', label: 'Version'},
  {id: 'owner_id', label: 'Owner'},
  {id: 'permissions', label: 'Members',
    format: (perms) => {
      if (!perms) return `Only me`
      return perms.length == 1 ? `Only me` : `${perms.length} members`
    }
  },
  {id: 'repo', label: 'Repo',
    format: (_, {details: obj}) => {
      const url = obj.source.url

      return (
        <a href={url} target="_blank" rel="noreferrer" className="flex items-center">
          <GithubIcon fontSize="small" className="text-color" />&nbsp;
          {url.slice(url.lastIndexOf('/') + 1).replace('.git', '')}
        </a>
      )
    }
  },
  {id: 'id', label: 'Version', hide: true},
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


export default function AppList() {
  const params = useParams()
  const history = useHistory()

  const query = params.get('query') || ''

  const [data, setData] = useState<Row[]>()
  const [rows, setRows] = useState<Row[]>()
  const [error, setError] = useState(null)

  const [showLatestVers, setShowLatestVers] = useState(true)
  const [viewStyle, setViewStyle] = useState<'compact' | 'spacious'>('spacious')


  useEffect(() => {
    ECR.listAll({namespace: 'sage'})
      .then(data => setData(data))
      .catch(error => setError(error.message))
  }, [])

  useEffect(() => {
    if (!data) return

    // implement show latest toggle
  }, [data, showLatestVers])


  useEffect(() => {
    if (!data) return

    setRows(queryData(data, query))
  }, [query, data])


  // todo: refactor into useContext or table componnent
  const onSearch = ({query}) => {
    if (query) params.set('query', query)
    else params.delete('query')
    history.push({search: params.toString()})
  }


  return (
    <Root>
      <Controls>
        <TableSearch
          value={query}
          onSearch={onSearch}
        />

        <Button
          component={Link}
          to="/apps/create-app"
          variant="contained"
          color="primary"
          startIcon={<AddIcon/>}
          size="small"
        >
          New App
        </Button>

        <FormControlLabel
          control={
            <Checkbox
              checked={showLatestVers}
              color="primary"
              size="small"
              inputProps={{ 'aria-label': 'show latest versions' }}
            />
          }
          label="latest versions"
        />

        <div>
          <IconButton
            onClick={() => setViewStyle('compact')}
            color={viewStyle == 'compact' ? 'primary' : 'default'}
            size="small"
          >
            <ViewComfyIcom />
          </IconButton>
          <IconButton
            onClick={() => setViewStyle('spacious')}
            color={viewStyle == 'spacious' ? 'primary' : 'default'}
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
        <FancyLayout
          columns={columns}
          rows={rows}
        />
      }

      {error &&
        <Alert severity="error">{error}</Alert>
      }
    </Root>
  )
}

const Root = styled.div`
  margin-top: 20px;
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

