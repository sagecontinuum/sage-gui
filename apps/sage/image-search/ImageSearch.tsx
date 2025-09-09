import { useEffect, useState } from 'react'
import { ImageCard } from './ImageCard'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components'

import { Card, CardViewStyle } from '/components/layout/Layout'
import {
  Box, Button, TextField, IconButton, CircularProgress, InputAdornment
} from '@mui/material'

import Table, { Column } from '/components/table/Table'

import { submitImageSearch, streamImageSearchResults } from '/components/apis/imageSearch'
import { ClearOutlined, SearchOutlined } from '@mui/icons-material'
import { useProgress } from '/components/progress/ProgressProvider'
import MapGL from '/components/Map'
import { uniqBy } from 'lodash'

import { queryData } from '/components/data/queryData'
import ImageSearchChip from './ImageSearchChip'
import SageLogo from '/components/nav-bar/SageLogo'


const hiddenCols = ['explainScore']

const numbers = ['score', 'rerank_score', 'location_lat', 'location_lon']

function getColumns(data) {
  return data.headers.map((label, i) => {
    const obj: Column = {
      id: label,
      label: label,
    }

    if (label == 'caption') {
      obj.width = '50%'
    }

    if (i > 5 || hiddenCols.includes(label) ) {
      obj.hide = true
    }

    if (label == 'link') {
      obj.format = (val) => <a href={val} target="_blank" rel="noopener noreferrer">{val}</a>
    }
    if (label == 'vsn') {
      obj.format = (val) =>
        <a href={`/node/${val}`} target="_blank" rel="noopener noreferrer">
          {val}
        </a>

      if (numbers.includes(label)) {
        obj.type = 'number'
      }
    }

    return obj
  })
}


function getRows(data) {
  return data.data.map((row) => {
    const rowObj = {}
    data.headers.forEach((header, i) => {
      rowObj[header] = row[i]
    })
    return rowObj
  })
}



export default function ImageSearch() {
  const {pathname} = useLocation()

  const [query, setQuery] = useState('')
  const [columns, setColumns] = useState(null)
  const [data, setData] = useState(null)
  const [filteredRows, setFilteredRows] = useState([])
  const [tableQuery] = useState('')

  const [queryTime, setQueryTime] = useState()
  const [page, setPage] = useState(0)

  const [updateID, setUpdateID] = useState(0)

  const {loading, setLoading} = useProgress()

  useEffect(() => {
    setTimeout(() => {
      setUpdateID(prev => prev + 1)
    })
  }, [data])

  const handleSubmit = (q) => {
    setLoading(true)

    const startTime = performance.now()
    submitImageSearch(q || query)
      .then((eventId) => {
        if (!eventId) throw new Error('No event_id returned from submitImageSearch')
        return streamImageSearchResults(eventId)
      })
      .then((jsonData) => {
        const d = JSON.parse(jsonData)[0]

        const endTime = performance.now()
        const elapsed = ((endTime - startTime) / 1000)
        setQueryTime(elapsed)

        setColumns(getColumns(d))

        const rows = getRows(d)
        setData(rows)
        setFilteredRows(rows)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error in image search:', err)
        setLoading(false)
      })
  }

  const handleChipClick = (evt) => {
    const label = evt.target.textContent

    setQuery(label)
    handleSubmit(label)
  }

  const handleTableSearch = (q) => {
    setFilteredRows(queryData(data, q.query))
    setUpdateID(prev => prev + 1)
  }

  const handlePage = (val) => {
    setPage(val)
  }


  const mapData = filteredRows ? uniqBy(
    filteredRows.map(obj => ({
      lat: obj.location_lat,
      lng: obj.location_lon,
      vsn: obj.vsn,
      status: 'reporting',
      markerClass: 'blue-marker'
    }))
    , 'vsn') : []


  return (
    <Root className="flex column gap items-center">
      <CardViewStyle />

      <Box
        sx={{
          width: '100%',
          maxWidth: (data || loading) ? '100%' : 1050,
          mx: { xs: 1, sm: 3, md: 'auto' },
          ...( (data || loading)
            ? {}
            : {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 130,
              // Center vertically in viewport
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: '25%',
              margin: 'auto',
              height: 130,
            }),
        }}
      >

        <Logo className="flex items-center" style={{marginBottom: data ? 0 : 10}}>
          <SageLogo beta={false} />
          <ISLogo className="flex column"><span>Image</span><span>Search</span></ISLogo>
        </Logo>
        <PromptContainer>

          <Box
            className="flex column items-center"
            sx={{
              m: { xs: 1, sm: 2 },
            }}
          >

            <Box className="flex items-center w-full">
              <form
                style={{ width: '100%', display: 'flex', alignItems: 'center' }}
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSubmit()
                }}
              >
                <TextField
                  placeholder="Enter a query or description... "
                  fullWidth
                  margin="normal"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  sx={{
                    minWidth: 200,
                    maxWidth: '100%',
                    marginRight: 2,
                  }}
                  slotProps={{
                    inputLabel: { shrink: true },
                    input: {
                      startAdornment: <InputAdornment position="start"><SearchOutlined /></InputAdornment>,
                      endAdornment:
                      query.length > 0 && (
                        <IconButton
                          size="small"
                          onClick={() => {
                            setQuery('')
                          }}
                        >
                          <ClearOutlined fontSize="small" />
                        </IconButton>
                      ),
                    },
                  }}
                />
                <Button
                  variant="contained"
                  type="submit"
                  size='medium'
                  sx={{
                    maxWidth: 400,
                    minWidth: 120,
                  }}
                >
                Search
                </Button>
              </form>
            </Box>

            {/* Example Queries */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1,
                width: '100%',
                justifyContent: { xs: 'flex-start', sm: 'center' },
                mt: 1,
              }}
            >
              <ImageSearchChip label="Show me images in Hawaii" onClick={handleChipClick} />
              <ImageSearchChip label="Snowy Mountains" onClick={handleChipClick} />
              <ImageSearchChip label="Show me clouds in the top camera" onClick={handleChipClick} />
              {/* <ImageSearchChip label="Cars in W049" onClick={handleChipClick} />*/}
              <ImageSearchChip label="W040" onClick={handleChipClick} />
              {/* <ImageSearchChip label="intersection in the right camera" onClick={handleChipClick} /> */}
            </Box>
          </Box>
        </PromptContainer>
      </Box>


      {loading &&
        <Card sx={{ width: '100%' }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 500,
            width: '100%',
          }}>
            <CircularProgress />
          </Box>
        </Card>
      }

      {/* Images Returned Section */}
      {data && filteredRows && !loading && (
        <Card noPad style={{width: '100%'}}>
          <Title>
            <h2 className="flex items-center justify-between gap">Images
              <small className="muted">
                {data.length} results{queryTime ? ` in ${queryTime.toFixed(2)} seconds` : ''}
                {filteredRows.length != data.length ? ` (${filteredRows.length} shown)` : ''}
              </small>
            </h2>
          </Title>
          <ScrollableWrapper>
            <TopShadow />
            <Box sx={{
              display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center',
              alignItems: 'center', height: 700, overflowY: 'auto' }}
            >
              {filteredRows.map((obj, i) => (
                <ImageCard key={i} obj={obj} />
              ))}
            </Box>
          </ScrollableWrapper>
        </Card>
      )}

      {data &&
        <Card noPad sx={{width: '100%'}}>
          <div style={{visibility: (mapData.length > 0) ? 'visible' : 'hidden', width: '100%'}}>
            <MapGL
              data={mapData}
              updateID={updateID}
            />
          </div>
        </Card>
      }


      {/* Metadata Table */}
      {data && (
        <Card sx={{width: '100%'}}>
          <TableContainer>
            <Table
              // primaryKey='rowID'
              columns={columns}
              rows={filteredRows}
              pagination
              page={page}
              rowsPerPage={10}
              onPage={handlePage}
              limit={filteredRows.length} // todo(nc): "limit" is fairly confusing
              enableSorting
              enableDownload
              sort="-caption"
              search={tableQuery}
              onSearch={handleTableSearch}
              storageKey={pathname}
              onColumnMenuChange={() => { /* do nothing */ }}
              middleComponent={<div></div>}
              total={filteredRows.length} // Total number of rows
            />
          </TableContainer>
        </Card>
      )}

      <br/><br/><br/>

    </Root>
  )
}



const Root = styled.div`
  margin: 1rem 5rem;

  // todo(nc): fix in table component
  [data-testid="SettingsOutlinedIcon"] {
    margin-right: 1rem;
  }
`

const TableContainer = styled.div`
  margin: 1rem;
`

const Title = styled.div`
  h2 {
    margin:0;
    padding: 1rem 1rem 0 1rem;

    small {
      font-size: 10pt;
    }
  }
`

const ScrollableWrapper = styled.div`
  position: relative;
  padding-top: 16px;
`

const TopShadow = styled.div`
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 16px;
  pointer-events: none;
  background: #fff;
  box-shadow: 2px 8px 10px 0px rgba(0, 0, 0, 0.18);
  z-index: 2;
`

const boxShadow = `
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  box-shadow:
    0px 2px 4px -1px rgb(0 0 0 / 0%),
    0px 4px 5px 0px rgb(0 0 0 / 0%),
    0px 1px 10px 0px rgb(0 0 0 / 12%);
`


const PromptContainer = styled.div`
  ${boxShadow}

  position: sticky;
  z-index: 1;
  background: #fff;
  border-radius: 10px;
  background: #fff;
`

const Logo = styled.div`
  .logo {
    font-size: 20pt;
  }

  .logo img {
    height: 60px;
  }
`

const ISLogo = styled.div`
  font-size: 1.8em;
  font-family: 'Open sans', sans-serif;
  font-weight: 800;
  color: #6d6d6d;
  margin-left: -10px;
  line-height: 1em;
`

