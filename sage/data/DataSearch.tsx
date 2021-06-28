/* eslint-disable react/display-name */
import React, { useState, useEffect } from 'react'
import { Link, useLocation, useHistory } from 'react-router-dom'
import styled from 'styled-components'

import IconButton from '@material-ui/core/IconButton'
import SpaciousIcon from '@material-ui/icons/ViewStream'
import ViewComfyIcom from '@material-ui/icons/ViewComfy'
import Badge from '@material-ui/core/Badge'
// import Chip from '@material-ui/core/Chip'

import ErrorMsg from '../ErrorMsg'
import Table from '../../components/table/Table'
import TableSearch from '../../components/table/TableSearch'
import { useProgress } from '../../components/progress/ProgressProvider'

import Breadcrumbs from './BreadCrumbs'
import Filter from './Filter'

import config from '../../config'
import Alert from '@material-ui/lab/Alert'
const url = config.sageCommons


const columns = [
  {
    id: 'title',
    label: 'Title',
    format: (val, obj) =>
      <Link to={`/data/product/${obj.name}`}>{val.replace(`: ${obj.name}`, '')}</Link>
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
    format: (arr) => {
      return arr.filter(o => o.format)
        .map(o => <Badge key={o.format}badgeContent={o.format} color="primary" />)
    }
  },
  /*{
    id: 'tags',
    label: 'Tags',
    format: (obj) =>
      obj.map(tag => <Chip key={tag.name} label={tag.display_name} variant="outlined" size="small"/>)
  }*/
]


type FacetState = {
  [name: string]: []
}

const initFacets = {
  'organization': [],
  'tags': [],
  'format': [],
  'resources': []
}

const facetList = Object.keys(initFacets)
const facetStr = JSON.stringify(facetList)


// builds filter query in form:
//    name:("filter one" AND "filter two")
function fqBuilder(facets: FacetState) {
  const parts = Object.entries(facets)
    .filter(([_, vals]) => vals.length )
    .map(([name, vals]) =>
      `${name}:(${vals.map(v => `"${v}"`).join(' AND ')})`
    )

  return parts.length ? `&fq=${parts.join(' AND ')}` : ``
}


const useQueryParams = () =>
  new URLSearchParams(useLocation().search)


export default function Search() {
  const params = useQueryParams()
  const query = params.get('query') || ''
  const history = useHistory()

  const {setLoading} = useProgress()
  const [rows, setRows] = useState()
  const [facets, setFacets] = useState(null)
  const [error, setError] = useState(null)


  const [filterState, setFilterState] = useState<FacetState>(initFacets)
  const [viewStyle, setViewStyle] = useState<'compact' | 'spacious'>('compact')


  useEffect(() => {
    setLoading(true)

    const req = `${url}/action/package_search?facet.field=${facetStr}${fqBuilder(filterState)}`
    // console.log('req', req)
    fetch(req)
      .then(res => res.json())
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
            <div>
              <TableSearch
                onSearch={onSearch}
                width="300px"
              />
            </div>

            <div className="flex">
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
