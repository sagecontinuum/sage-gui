/* eslint-disable react/display-name */
import React, { useState, useEffect } from 'react'
import { Link, useLocation, useHistory } from 'react-router-dom'
import styled from 'styled-components'

import Alert from '@material-ui/lab/Alert'
import Chip from '@material-ui/core/Chip'

import ErrorMsg from '../ErrorMsg'
import Table from '../../components/table/Table'
import TableSearch from '../../components/table/TableSearch'
import { useProgress } from '../../components/progress/ProgressProvider'

import Breadcrumbs from './BreadCrumbs'
import Filter from './Filter'
import LayoutToggle from '../common/LayoutToggle'
import DataProductList from './SpaciousDataList'

import * as Data from '../apis/data'


const typeColorMap = {
  default: 'rgb(28,140,201)',
  JSON: '#efdb50',
  PDF: '#ac3535',
  TAR: '#4e4e4e',
}

export const formatter = {
  title: (val, obj) => {
    return <Link to={`/data/product/${obj.name}`}>{val.replace(`: ${obj.name}`, '')}</Link>
  },
  resources: (arr) => (
    arr.filter(o => o.format)
      .map(o =>
        <div key={o.format} className="flex items-center">
          <Dot style={{backgroundColor: o.format in typeColorMap ? typeColorMap[o.format] : typeColorMap.default}} />
          <div className="muted">{o.format.toLowerCase()}</div>
        </div>
      )
  ),
  tags: (obj) =>
    obj.map(tag => <Chip key={tag.name} label={tag.display_name} variant="outlined" size="small"/>)
}

const Dot = styled.div`
  display: inline-block;
  height: 12px;
  width: 12px;
  border-radius: 50%;
  margin-right: 3px;
`


const columns = [
  {
    id: 'title',
    label: 'Title',
    format: formatter.title
  }, {
    id: 'name',
    label: 'Name',
    format: (val, obj) => val
  }, {
    id: 'organization',
    label: 'Organization',
    format: (obj) => obj.name
  }, {
    id: 'resources',
    label: 'Type',
    format: formatter.resources
  },
  /*{
    id: 'tags',
    label: 'Tags',
    format: formatter.tags
  }*/
]




const initFilterState = {
  'organization': [],
  'tags': [],
  'format': [],
  'resources': []
}

const facetList = Object.keys(initFilterState)



const useQueryParams = () =>
  new URLSearchParams(useLocation().search)


export default function Search() {
  const params = useQueryParams()
  const query = params.get('query') || ''
  const history = useHistory()

  const {setLoading} = useProgress()
  const [rows, setRows] = useState<Data.Result[]>()
  const [facets, setFacets] = useState(null)
  const [error, setError] = useState(null)


  const [filterState, setFilterState] = useState<Data.FilterState>(initFilterState)
  const [viewStyle, setViewStyle] = useState<'compact' | 'spacious'>('spacious')


  useEffect(() => {
    setLoading(true)

    Data.search({facets: facetList, filters: filterState})
      .then(data => {
        const {results, search_facets} = data.result
        setRows(results)
        setFacets(search_facets)
      })
      .catch(error => setError(error))
      .finally(() => setLoading(false))

  }, [setLoading, query, filterState])


  // todo: refactor into useContext or table componnent?
  const onSearch = ({query}) => {
    if (query) params.set('query', query)
    else params.delete('query')
    history.push({search: params.toString()})
  }


  const handleFilter = (facet: string, val: string) => {
    setFilterState(prev => {
      return {
        ...prev,
        [facet]: prev[facet].includes(val) ?
          prev[facet].filter(v => v != val) : [...prev[facet], val]
      }
    })
  }


  return (
    <Root>
      <Alert severity="info" style={{borderBottom: '1px solid #f2f2f2' }}>
        The data explorer is currently under development and available here for <b>early preview</b>.
        Pease check back later when more data is available.
      </Alert>
      <Content>
        <Sidebar>
          <FiltersTitle>Filters</FiltersTitle>
          {facets && facetList.map(facet =>
            <Filter
              key={facet}
              title={facet}
              checked={filterState[facet]}
              onCheck={(val) => handleFilter(facet, val)}
              type="text"
              data={facets[facet].items}
            />
          )}
        </Sidebar>

        <Main>
          <Breadcrumbs path="/data/" />

          <Controls className="flex items-center justify-between">
            <TableSearch
              onSearch={onSearch}
              width="300px"
            />

            <LayoutToggle
              layout={viewStyle}
              onClick={view => setViewStyle(view)}
            />
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
            <DataProductList
              rows={rows}
            />
          }

          {error &&
            <ErrorMsg>{error}</ErrorMsg>
          }
        </Main>

      </Content>

    </Root>
  )
}

const Root = styled.div`
  display: flex;
  flex-direction: column;
`

const Content = styled.div`
  display: flex;
`

const Main = styled.div`
  height: 100%;
  padding: 20px;
  width: 100%;
`

const Sidebar = styled.div`
  height: calc(100vh - 60px);
  padding-top: 10px;
  width: 250px;
  min-width: 250px;
  border-right: 1px solid #f5f5f5;
`

const FiltersTitle = styled.h2`
  margin-left: 10px;

`


const Controls = styled.div`
  .MuiButton-root,
  .MuiFormControlLabel-root {
    margin: 0 10px;
  }
`
