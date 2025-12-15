import { useEffect, useState } from 'react'
import {type Record} from '/components/apis/beehive'
import { TablePagination, TextField, IconButton, InputAdornment } from '@mui/material'
import { useSearchParams } from 'react-router-dom'

import PTZYolo, { handleAppSearch } from './viewers/PTZApp'

import { ToggleButtonGroup, ToggleButton } from '@mui/material'
import { AnalyticsOutlined, TableRowsOutlined, Clear } from '@mui/icons-material'
import useDebounce from '/components/hooks/useDebounce'

import JsonURL from '@jsonurl/jsonurl'


type Props = {
  data: Record[]
  showViewer: boolean
  onViewModeChange: (val: boolean) => void
}

export default function CustomViewer(props: Props) {
  const {data, showViewer, onViewModeChange} = props
  const [params, setParams] = useSearchParams()
  const [page, setPage] =  useState(0)

  // Initialize query from URL params
  const viewerParamsStr = params.get('viewer-params')
  const initialQuery = viewerParamsStr ? (JsonURL.parse(viewerParamsStr) as {query?: string})?.query || '' : ''

  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)
  const [filteredData, setFilteredData] = useState<Record[]>()

  useEffect(() => {
    setFilteredData(data)
  }, [data])

  const debouncedSearch = useDebounce(() => {
    setDebouncedQuery(query)
  })

  useEffect(() => {
    debouncedSearch()
  }, [debouncedSearch, query])

  // Update URL params when query changes
  useEffect(() => {
    if (query) {
      const viewerParams = JsonURL.stringify({query})
      setParams(prev => {
        const newParams = new URLSearchParams(prev)
        newParams.set('viewer-params', viewerParams)
        return newParams
      })
    } else {
      setParams(prev => {
        const newParams = new URLSearchParams(prev)
        newParams.delete('viewer-params')
        return newParams
      })
    }
  }, [query])

  useEffect(() => {
    if (debouncedQuery.trim().length === 0) {
      setFilteredData(data)
      return
    }
    handleSearch()
  }, [debouncedQuery])


  const handleSearch = () => {
    let newData
    if (handleAppSearch) {
      console.log('using advanced search', debouncedQuery)
      newData = handleAppSearch(data, debouncedQuery)
    } else {
      // basic search on filenames
      newData = data.filter(record => {
        const {meta} = record
        const {filename} = meta

        // Check if label matches search query (case-insensitive)
        return filename.toLowerCase().includes(debouncedQuery.toLowerCase())
      })
    }

    setFilteredData(newData)
    setPage(0)
  }

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
  }


  return (
    <>
      <div className="flex justify-between items-center">
        <div className="flex gap">
          <ToggleButtonGroup>
            <ToggleButton
              value="show-viewer"
              selected={showViewer}
              onChange={() => onViewModeChange(true)}
            >
              <AnalyticsOutlined />Custom Viewer
            </ToggleButton>
            <ToggleButton
              value="show-table"
              selected={!showViewer}
              onChange={() => onViewModeChange(false)}
            >
              <TableRowsOutlined /> Table
            </ToggleButton>
          </ToggleButtonGroup>

          {showViewer &&
            <TextField
              label="Search for label"
              variant="outlined"
              sx={{width: 300}}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter groups by label..."
              InputProps={{
                endAdornment: query && (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setQuery('')}
                      edge="end"
                      size="small"
                    >
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          }
        </div>

        {showViewer &&
          <TablePagination
            rowsPerPageOptions={[20]}
            count={filteredData?.length}
            rowsPerPage={20}
            page={page}
            onPageChange={handlePageChange}
          />
        }
      </div>

      {showViewer &&
        <PTZYolo
          data={filteredData.slice(page * 20, (page + 1) * 20)}
          searchString={query}
        />
      }

      {showViewer &&
        <div className="flex justify-center">
          <div></div>
          <TablePagination
            rowsPerPageOptions={[20]}
            count={filteredData?.length}
            rowsPerPage={20}
            page={page}
            onPageChange={handlePageChange}
          />
        </div>
      }
    </>
  )
}