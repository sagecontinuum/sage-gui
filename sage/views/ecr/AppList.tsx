/* eslint-disable react/display-name */
import React, { useEffect, useState } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import Button from '@material-ui/core/Button'
import IconButton from '@material-ui/core/IconButton'
import Checkbox from '@material-ui/core/Checkbox'
import AddIcon from '@material-ui/icons/AddRounded'
import ViewComfyIcom from '@material-ui/icons/ViewComfy'
import ViewHeadlineIcom from '@material-ui/icons/ViewHeadline'
import Alert from '@material-ui/lab/Alert'


import Table from '../../../components/table/Table'
import TableSearch from '../../../components/table/TableSearch'

import * as ECR from '../../api/ecr'
import FormControlLabel from '@material-ui/core/FormControlLabel'


const columns = [
  {id: 'name', label: 'Name',
    format: (name, o) => <Link to={`app/${o.namespace}/${name}/${o.version}`}>{name}</Link>
  },
  {id: 'namespace', label: 'Namespace'},
  {id: 'owner_id', label: 'Owner'},
  {id: 'version', label: 'Version'},
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
  const [viewStyle, setViewStyle] = useState<'compact' | 'spacious'>('compact')


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
      <h3>
        My Apps
      </h3>

      <Button
        component={Link}
        to="/apps/create-app"
        variant="outlined"
        color="primary"
        startIcon={<AddIcon/>}
        size="small"
      >
        Add App
      </Button>

      <br/>
      <br/>

      <Controls>
        <TableSearch
          value={query}
          onSearch={onSearch}
        />

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
            <ViewHeadlineIcom />
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

      {viewStyle == 'spacious' &&
        <p>Not implemented yet</p>
      }

      {error &&
        <Alert severity="error">{error}</Alert>
      }
    </Root>
  )
}

const Root = styled.div`
  margin-top: 50px;
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

