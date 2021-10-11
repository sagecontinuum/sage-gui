/* eslint-disable react/display-name */
import React, { useState, useEffect } from 'react'
import { Link, useLocation, useHistory } from 'react-router-dom'
import styled from 'styled-components'

import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'

import ErrorMsg from '../ErrorMsg'
import Table from '../../components/table/Table'
import TableSearch from '../../components/table/TableSearch'
import { useProgress } from '../../components/progress/ProgressProvider'

import Breadcrumbs from './BreadCrumbs'
import Filter from './Filter'
import LayoutToggle from '../common/LayoutToggle'
import {Top} from '../common/Layout'
import DataProductList from './SpaciousDataList'
import QueryViewer from '../../components/QueryViewer'
import BeeIcon from 'url:../../assets/bee.svg'

import * as Data from '../apis/data'
import * as utils from '../../components/utils/units'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'

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
  ,
  time: val => {
    return utils.msToTimeApprox(Date.now() - new Date(val).getTime())
  }
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
  'res_format': []
}

const facetList = Object.keys(initFilterState)



const useQueryParams = () =>
  new URLSearchParams(useLocation().search)


export default function Search() {
  const params = useQueryParams()
  const query = params.get('query') || ''
  const history = useHistory()

  const {setLoading} = useProgress()
  const [rows, setRows] = useState<Data.Result[]>(null)
  const [facets, setFacets] = useState(null)
  const [error, setError] = useState(null)

  const [sort, setSort] = useState('most_relevant')

  const [filterState, setFilterState] = useState<Data.FilterState>(initFilterState)
  const [viewStyle, setViewStyle] = useState<'compact' | 'spacious'>('spacious')


  useEffect(() => {
    setLoading(true)

    Data.search({facets: facetList, filters: filterState, query})
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

      <div className="flex">
        <Sidebar>
          <FiltersTitle>Filters</FiltersTitle>
          {facets && facetList.map(facet => {
            const {title, items} = facets[facet]
            return (
              <Filter
                key={title}
                title={title.replace('res_', '').replace(/\b[a-z](?=[a-z]{1})/g, c => c.toUpperCase())}
                checked={filterState[facet]}
                onCheck={(val) => handleFilter(facet, val)}
                type="text"
                data={items}
              />
            );
          })}
        </Sidebar>

        <Main>
          <Top>
            <div className="flex items-center gap" style={{backgroundColor: '#fff'}}>
              <Breadcrumbs path="/data/"/>

              <QueryViewer filterState={filterState} />
            </div>


            <Controls className="flex items-center justify-between">
              <div className="flex items-ceter gap">
                <TableSearch
                  onSearch={onSearch}
                  width="300px"
                />
                <FormControl variant="outlined" className="flex self-center">
                  <Select
                    labelId="namespace-label"
                    id="namepsace"
                    value={sort}
                    onChange={evt => alert('Sorting is not implemented yet.  Check back later.') /*setSort(evt.target.value)*/}
                    variant="outlined"
                    margin="dense"
                    style={{marginTop: '1px'}}
                  >
                    <MenuItem value={'most_relevant'}>most relevant</MenuItem>
                    <MenuItem value={'name_accending'}>name ascending</MenuItem>
                    <MenuItem value={'name_decending'}>name decending</MenuItem>
                    <MenuItem value={'last_mod'}>last modified</MenuItem>
                  </Select>
                </FormControl>
              </div>


              <LayoutToggle
                layout={viewStyle}
                onClick={view => setViewStyle(view)}
              />
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
            <DataProductList
              rows={rows}
              query={query}
            />
          }

          {/* todo: refactor */}
          {rows && !rows.length &&
            <NoneFound className="flex column items-center justify-center muted">
              <img src={BeeIcon} />
              <span>No data was found</span>
            </NoneFound>
          }

          {error &&
            <ErrorMsg>{error}</ErrorMsg>
          }
        </Main>

      </div>

    </Root>
  );
}

const Root = styled.div`
  display: flex;
  flex-direction: column;
`

const Sidebar = styled.div`
  position: sticky;
  top: 0;
  height: calc(100vh - 60px);
  padding-top: 10px;
  width: 250px;
  min-width: 250px;
  border-right: 1px solid #f5f5f5;
`

const FiltersTitle = styled.h2`
  margin-left: 10px;
`

const Main = styled.div`
  position: relative;
  height: 100%;
  padding: 0 20px;
  width: 100%;
`

const Controls = styled.div`
  background-color: #fff;
  padding: 5px 0;
  border-bottom: 1px solid #ddd;
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


