import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'

import Table from '/components/table/Table'
import * as BK from '/components/apis/beekeeper'
import { useProgress } from '/components/progress/ProgressProvider'

import { formatters } from '/apps/sage/jobs/JobStatus'
import ErrorMsg from '/apps/sage/ErrorMsg'

import { marked } from 'marked'
import { queryData } from '/components/data/queryData'
import { Chip } from '@mui/material'
import FilterMenu from '/components/FilterMenu'
import { filterData, FilterState } from '../statusDataUtils'
import { parseQueryStr } from '/components/utils/queryString'
import QueryViewer from '/components/QueryViewer'


const getTitle = (hardware: string, description: string) => {
  const match = description.match(/^#\s+(.+)\r\n/m)
  const title = match ? match[1] : null
  return title ? title : hardware
}


const getDescriptionHTML = (description: string) => {
  if (!description) return

  // ignore h1 titles since handled separately for links
  const match = description.match(/^#\s+(.+)\r\n/m)
  const title = match ? match[0] : null
  const text = description.replace(title, '')

  const intro = text.split(/^\s+\r\n/m)[0]

  if (intro.length < text.length)
    return (
      <>
        <span dangerouslySetInnerHTML={{__html: marked(intro)}}></span>
        {/* <Link to={`/sensors/${hw_model}`}>read more...</Link> */}
      </>
    )

  return <span dangerouslySetInnerHTML={{__html: marked(intro)}}></span>
}


export const columns = [{
  id: 'hw_model',
  label: 'Model',
  width: '250px',
  format: (val, obj) =>
    <div>
      <div><small className="muted"><b>{obj.manufacturer}</b></small></div>
      <Link to={`/sensors/${obj.hw_model}`}>{val}</Link>
    </div>

}, {
  id: 'hardware',
  label: 'Developer Name (UUID)',
  format: (val, obj) =>
    <Link to={`/sensors/${obj.hardware}`}>{val}</Link>,
  hide: true
}, {
  id: 'description',
  label: 'Description',
  format: (description, obj) => {
    const {hardware, hw_model} = obj

    return (
      <div>
        <h3>
          <div className="flex justify-between">
            {getTitle(hardware, description)}
          </div>
        </h3>
        {getDescriptionHTML(description, hw_model)}
        <Tags>
          {obj.capabilities.map(v => (
            <Chip key={v} label={v} />
          ))}
        </Tags>
      </div>
    )
  }
}, {
  id: 'capabilities',
  label: 'Capabilities',
  format:(val) => val ? val.join(', ') : '-',
  hide: true
}, {
  id: 'nodeCount',
  label: 'Nodes',
  format: (_, obj) => {
    const count = obj.vsns.length
    return (
      <Link to={`/nodes?sensor="${encodeURIComponent(obj.hw_model)}"`}>
        {count} node{count != 1 ? 's' : ''}
      </Link>
    )
  },
  width: '100px'
}, {
  id: 'vsns',
  label: 'Node List',
  format: formatters.nodes,
  hide: true
}]

const Tags = styled.div`
  margin-bottom: 0.5em;
  .MuiChip-root {
    margin-right: 0.5em;
  }

`

type Option = {
  id: string,
  label: string
}

const getCapabilities = (data: BK.SensorHardware[]) : Option[] =>
  [...new Set(data.flatMap(obj => obj.capabilities)) ]
    .map(name => ({id: name, label: name}))


const initialState: FilterState = {
  capabilities: []
}


type Props = {
  project?: string
  vsns?: BK.VSN[]
}

export default function SensorList(props: Props) {
  const {project, vsns} = props

  const [params, setParams] = useSearchParams()
  const query = params.get('query') || ''

  const [data, setData] = useState<BK.SensorListRow[]>()
  const [filteredData, setFilteredData] = useState<BK.SensorListRow[]>()
  const [error, setError] = useState<Error>()
  const [capabilities, setCapabilities] = useState<Option[]>()
  const [filterState, setFilterState] = useState<FilterState>(initialState)


  const {setLoading} = useProgress()


  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)

    BK.getSensors()
      .then(data => {
        setData(data)
        setFilteredData(data)

        const opts = getCapabilities(data)
        setCapabilities(opts)
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false))

  }, [setLoading, project, vsns])

  useEffect(() => {
    if (!data) return

    const fs = parseQueryStr<FilterState>(params, {initialState, exclude: ['query']})
    setFilterState(fs)

    let d = queryData(data, query)
    d = filterData(d, fs)
    setFilteredData(d)
  }, [query, data, params])


  const handleQuery = ({query}) => {
    if (query) params.set('query', query)
    else params.delete('query')
    setParams(params, {replace: true})
  }


  const handleFilterChange = (field: string, vals: Option[]) => {
    // MUI seems to result in vals may be string or option; todo(nc): address this?
    const newStr = vals.map(item =>
      `"${typeof item == 'string' ? item : item.id}"`
    ).join(',')

    if (!newStr.length) params.delete(field)
    else params.set(field, newStr)
    setParams(params, {replace: true})
  }

  const handleQueryViewerChange = (field: string, next: string[]) => {
    if (!next.length) params.delete(field)
    else params.set(field, next.map(str => `"${str}"`).join(','))
    setParams(params, {replace: true})
  }

  return (
    <Root>
      <br/>
      {filteredData &&
        <Table
          primaryKey="id"
          storageKey="/sensors"
          columns={columns}
          rows={filteredData}
          enableSorting
          sort="+hw_model"
          search={query}
          onSearch={handleQuery}
          onColumnMenuChange={() => { /* do nothing */ }}
          onDoubleClick={(_, row: BK.SensorListRow) => navigate(`/sensors/${row.hw_model}`)}
          middleComponent={
            <FilterControls className="flex items-center">
              {capabilities &&
                <FilterMenu
                  label="Capabilities"
                  options={capabilities}
                  value={filterState.capabilities}
                  onChange={vals => handleFilterChange('capabilities', vals as Option[])}
                />
              }

              <QueryViewer
                filterState={filterState}
                onDelete={handleQueryViewerChange}
              />
            </FilterControls>
          }
        />
      }

      {error && <ErrorMsg>{error}</ErrorMsg>}
    </Root>
  )
}

const Root = styled.div`
  margin-top: 1em;

  h1 {
    margin: 0;
  }

  h3 {
    margin: 0 0 .5em 0;
  }
`

const FilterControls = styled.div`
  margin-left: 1.5em;
`
