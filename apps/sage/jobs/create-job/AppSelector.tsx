import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import CheckIcon from '@mui/icons-material/CheckRounded'
import LaunchIcon from '@mui/icons-material/LaunchRounded'

import Table from '/components/table/Table'
import { queryData } from './createJobUtils'
import * as ECR from '/components/apis/ecr'

import { formatDistance } from 'date-fns'

import settings from '/apps/sage/settings'
const {featuredApps, samplers} = settings
const featured = [...featuredApps, ...samplers]

const columns = [{
  id: 'id',
  label: 'Name',
  format: (val, obj) => {
    return (
      <>{val}</>
    )
  }
}, {
  id: 'featured',
  label: 'Featured App',
  format: (val, obj) => {
    const isFeatured = featured.find(row => featured.includes(`${obj.namespace}/${obj.name}`))
    return isFeatured ? <CheckIcon color="primary" /> : '-'
  }
}, {
  id: 'owner',
  label: 'Creator'
}, {
  id: 'time_last_updated',
  label: 'Last Updated',
  format: (val) => formatDistance(new Date(val), new Date(), { addSuffix: true })
}, {
  id: 'View',
  format: (_, obj) =>
    <Link to={`/apps/app/${obj.id.split(':')[0]}`} target="_blank">
      view app <LaunchIcon className="external-link"/>
    </Link>
}]



export type AppRow = {
  id: string
  owner: string
  time_last_updated: string
}


type Props = {
  selected: {id: string}[]
  onSelected: (apps: ECR.App[]) => void
}


export default function AppSelector(props: Props) {
  const {onSelected} = props

  const [data, setData] = useState<AppRow[]>()
  const [filtered, setFiltered] = useState<AppRow[]>()
  const [query, setQuery] = useState<string>('')
  const [page, setPage] = useState(0)

  const [selected, setSelected] = useState(props.selected)

  useEffect(() => {
    setSelected(props.selected)
  }, [props.selected])

  useEffect(() => {
    ECR.listApps('public')
      .then(apps => {
        setData(apps)
        setFiltered(apps)
      })
  }, [])

  useEffect(() => {
    if (!data) return

    const cols = ['id', 'owner', 'time_last_updated']
    setFiltered(queryData(data, query, cols))
  }, [query])


  const handleSelection = ({objs}) => {
    onSelected(objs)
  }

  return (
    <AppSelectorRoot>
      {filtered &&
        <Table
          primaryKey="id"
          enableSorting
          checkboxes
          disableClickOutside
          columns={columns}
          rows={filtered}
          pagination
          page={page}
          limit={data.length}
          rowsPerPage={10}
          onSearch={({query}) => setQuery(query || '')}
          middleComponent={<div className="flex-grow"></div>}
          selected={selected.map(o => o.id)}
          onSelect={handleSelection}
        />
      }
    </AppSelectorRoot>
  )
}

const AppSelectorRoot = styled.div`
  width: 100%;
`

