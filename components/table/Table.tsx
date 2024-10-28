import {
  useState, useEffect, useReducer,
  useRef, useCallback,
  MouseEvent, ChangeEvent
} from 'react'

import styled from 'styled-components'

import TableContainer from '@mui/material/TableContainer'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'

import MoreIcon from '@mui/icons-material/MoreVert'
import InfoIcon from '@mui/icons-material/InfoOutlined'
import ArrowDown from '@mui/icons-material/ArrowDropDown'
import ArrowUp from '@mui/icons-material/ArrowDropUp'

import DownloadTableBtn, { formatDownloadCol } from './DownloadTableBtn'
import ColumnMenu from './ColumnMenu'
import TableSearch from './TableSearch'
import Checkbox from '/components/input/Checkbox'
import * as LS from '/components/apis/localStorage'
import { strToBlob } from '/components/utils/strToBlob'

import selectedReducer, { SelectedState, getInitSelectedState } from './selectedReducer'
import useClickOutside from '../hooks/useClickOutside'
import TableSkeleton from './TableSkeleton'

import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'


export { SelectedState, TableSkeleton }

// prefix for saving table state in localstorage
const STORAGE_PREFEX = 'sage-table-columns-'


/*
const exampleColumns = [
  {
    id: '123',
    label: 'foo bar',
    width: '10%'
  }, {
    id: '1234',
    label: 'test',
    width: '200px',
    type: 'number'
  }, {
    id: 'population',
    label: 'Population',
    align: 'right', // or use type: 'number'
    format: (value, rowObj) => value.toLocaleString(),
  }
]
*/

export type Column = {
  id: string
  label?: string
  format?: (val: any, row: object) => string | number | JSX.Element | JSX.Element[]
  dlFormat?: (val: any, row: object) => string
  hide?: boolean
  width?: string
  type?: 'number'
  align?: 'right'
}

type Row = { rowID: number }
type Rows = Row[]


const Cell = props =>
  <TableCell {...props}>
    {props.children}
  </TableCell>



const RowCells = ({columns, row}) =>
  <>
    {
      columns.map(col => {
        const val = row[col.id]

        return (
          <Cell
            key={col.id}
            align={col.type == 'number' ? 'right' : col.align}
            style={{width: col.width}}
          >
            {col.format ? col.format(val, row) : (val ? val : '-')}
          </Cell>
        )
      })
    }
  </>

type RowProps = {
  columns: object[]
  row: Row,
  id: number,
  emptyCell: boolean,
  selected: any, // todo: type
  checkboxes: boolean,
  onSelect?: (
    evt: MouseEvent<HTMLElement> | ChangeEvent<HTMLInputElement>,
    id: number,
    row: object
  ) => void
  onDoubleClick: (evt: MouseEvent, row: object) => void
  onMore?: () => void
  greyRow?: (row: object) => boolean
  collapsible?: JSX.Element
}

const Row = (props: RowProps) => {
  const {
    columns,
    row,
    id,
    emptyCell,
    selected,
    checkboxes,
    onSelect,
    onDoubleClick,
    onMore,
    greyRow,
    collapsible
  } = props

  const {rowID} = row
  const [open, setOpen] = useState(false)

  return (
    <>
      <TableRowComponent hover
        className={greyRow(row) && 'grey'}
        tabIndex={-1}
        key={id}
        onClick={evt => onSelect(evt, rowID, row)}
        onDoubleClick={evt => onDoubleClick(evt, row)}
        selected={selected.ids.includes(rowID)}
      >
        {emptyCell && <Cell></Cell>}

        {checkboxes &&
          <Cell key={id + '-checkbox'} style={{padding: 0, width: 1}}>
            <Checkbox
              checked={selected.ids.includes(rowID)}
              onClick={evt => onSelect(evt, rowID, row)}
            />
          </Cell>
        }

        <RowCells
          columns={columns}
          row={row}
        />

        {onMore &&
          <More className="more-btn">
            <IconButton>
              <MoreIcon />
            </IconButton>
          </More>
        }

        {collapsible && (
          <TableCell key={id + '-collapse'} style={{padding: 0, width: 1}}>
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </TableCell>
        )}
      </TableRowComponent>
      {collapsible && (
        <TableRowComponent style={{ backgroundColor: 'initial' }}>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={columns.length + 1}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 1 }}>
                {collapsible}
              </Box>
            </Collapse>
          </TableCell>
        </TableRowComponent>
      )}
    </>
  )
}

Row.displayName = 'TableComponent-Row'

const TableRowComponent = styled(TableRow)`
  // todo(nc)?: remove more button option
  &:hover {
    .more-btn {
      display: block;
    }
  }

  // disabledRowSelect Styling
  &.grey {
    background: #fcfcfc;

    td {
      color: #c7c7c7;
    }
  }
  &.disabled:hover {
    cursor: not-allowed;
  }
`

// todo(nc)?: remove more button option
const More = styled.span`
  position: absolute;
  background: #f5f5f5;
  padding: 0 20px;
  right: 20;
  display: none;
`


const TableRows = (props) => {
  const {
    rows,
    columns,
    checkboxes
  } = props

  return rows.map(row =>
    <Row key={row.rowID} id={row.rowID}
      row={row}
      columns={columns}
      checkboxes={checkboxes}
      {...props}   /* pass on all other props else! */
    />
  )
}


const getSortArrow = (colID, sort) =>
  <SortArrow>
    {colID in sort && (sort[colID] == 'dsc' ? <ArrowDown /> : <ArrowUp />)}
  </SortArrow>

const SortArrow = styled.span`
  position: absolute;
  & svg {
    width: .9em;
    height: .9em;
  }
`


const TableHeadComponent = (props) => {
  const {
    checkboxes,
    columns,
    handleSelectAll,
    allSelected,
    enableSorting,
    sortBy,
    handleSort
  } = props

  return (
    <TableRow>
      {/* if table has checkboxes (if table has select all checkbox) */}
      {checkboxes &&
        <TableCell style={{padding: 0, width: 1}} onClick={handleSelectAll}>
          <Checkbox checked={allSelected} />
        </TableCell>
      }

      {/* the main thead parts */}
      {columns.map(col => (
        <TableCell
          key={col.id}
          align={col.type == 'number' ? 'right' : col.align}
          style={{ width: col.width, cursor: enableSorting ? 'pointer' : '' }}
          onClick={() => handleSort(col)}
        >
          {col.label ? col.label : col.id} {getSortArrow(col.id, sortBy)}
        </TableCell>
      ))}
    </TableRow>
  )
}


const indexData = (data) =>
  data.map((row, i) => ({...row, rowID: i}))



const clientSideSort = (data, id, direction) => {
  let isArrayCol, isObject, isNumeric
  try {
    isArrayCol = Array.isArray(data[0][id])
    isObject = typeof data[0][id] === 'object'
    isNumeric = data.some(o => typeof o[id] === 'number')
  } catch {
    isArrayCol = false
    isObject = false
    isNumeric = false
  }

  if (isArrayCol) {
    // just use array lengths for now
    data.sort((a, b) =>
      direction == 'asc' ?
        a[id].length - b[id].length :
        b[id].length - a[id].length
    )
  } else if (isNumeric) {
    data.sort((a, b) =>
      direction == 'asc' ?
        (a[id] || -Infinity).toString()
          .localeCompare((b[id] || -Infinity).toString(), undefined, {numeric: true}) :
        (b[id] || -Infinity).toString()
          .localeCompare((a[id] || -Infinity).toString(), undefined, {numeric: true})
    )
  } else if (isObject) {
    // do nothing for objects
  } else {
    data.sort((a, b) =>
      direction == 'asc' ?
        (a[id] || '').localeCompare((b[id] || '')) :
        (b[id] || '').localeCompare((a[id] || ''))
    )
  }

  return data
}

const parseSort = (str) => ({
  [str.slice(1)]: str.charAt(0) == '-' ? 'dsc' : 'asc'
})


const decodeSort = (sortObj) => {
  if (!sortObj)
    return ''

  const id = Object.keys(sortObj)[0],
    order = sortObj[id]

  return `${order == 'dsc' ? '-' : '+'}${id}`
}


function getActiveTableCols(key: string, allCols: Column[]) : Column[] {
  const shownCols = allCols.filter(o => !o.hide)
  if (!key)
    return shownCols

  const cols = LS.get(`${STORAGE_PREFEX}${key}`)

  return !cols ? shownCols : allCols.filter(o => cols.includes(o.id))
}



// initial state of columns includes "hide". we'll manage hidden columns with "activeColumns"
const getVisibleColumns = (columns, activeColumns = null) => {
  if (activeColumns) {
    const activeIDs = activeColumns.map(o => o.id)
    return columns.filter(o => activeIDs.includes(o.id))
  }

  return columns.filter(o => !o.hide)
}


type Props = {
  primaryKey: string
  rows: object[]
  columns: Column[]
  page?: number | string
  limit?: number
  rowsPerPage?: number
  total?: number
  search?: string
  sort?: `+${string}` | `-${string}`
  emptyNotice?: string | JSX.Element
  pagination?: boolean
  offsetHeight?: string
  checkboxes?: boolean
  searchPlaceholder?: string
  stripes?: boolean
  enableSorting?: boolean
  enableDownload?: boolean
  getDownloadableData?: () => object[]
  disableClickOutside?: boolean
  selected?: number[]             // ids
  storageKey?: string             // store column state in localstorage, if provided
  onSearch?: (val: {query: string}) => void
  onSort?: (string) => void       // for ajax pagination
  onPage?: (number) => void       // for ajax pagination
  onSelect?: (state: SelectedState) => void        // todo: define
  onDoubleClick?: (evt: MouseEvent, row: object) => void
  onColumnMenuChange?: (any) => void | boolean
  onShowDetails?: () => void      // useful for details sidebar
  openFilters?: boolean
  onOpenFilters?: () => void
  onMore?: () => void             // todo: remove?

  // options for greying out and disabling selection on row
  greyRow?: (row: object) => boolean
  disableRowSelect?: (row: object) => boolean

  leftComponent?: JSX.Element
  middleComponent?: JSX.Element
  rightComponent?: JSX.Element
  collapsible?: JSX.Element
}




export default function TableComponent(props: Props) {
  const {
    primaryKey = 'rowID',
    pagination,
    offsetHeight,
    checkboxes,
    emptyNotice,
    stripes = true,
    enableSorting = false,
    enableDownload = false,
    storageKey,
    onSearch, onSort, onSelect, onDoubleClick, onColumnMenuChange,
    onShowDetails,
    greyRow = () => false,
    disableRowSelect = () => false,
    collapsible
  } = props

  if (pagination && (props.page === undefined || props.limit === undefined)) {
    throw `Grid component must provide 'page' and 'limit' when 'pagination' is used.
      page value was: ${props.page}; limit value was: ${props.limit}.`
  }

  const tableRef = useRef(null)

  const [columns, setColumns] = useState(getVisibleColumns(props.columns))
  const [page, setPage] = useState(Number(props.page))
  const [sortBy, setSortBy] = useState((props.sort && parseSort(props.sort)) || {})
  const [rowsPerPage, setRowsPerPage] = useState(props.rowsPerPage || 100)


  let data = indexData(props.rows)
  if (pagination) {
    data = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  }

  // may contain subset of rows via pagination, filtering, etc
  const [rows, setRows] = useState<Rows>(data)

  // keep state on shown/hidden columns
  // initial columns are defined in `columns` spec.
  const [activeColumns, setActiveColumns] = useState(getActiveTableCols(storageKey, props.columns))

  // disable user-select when shift+click is happening
  const [userSelect, setUserSelect] = useState(true)

  // selected/checkbox state
  const [allSelected, setAllSelected] = useState<boolean>(false)
  const [selected, dispatch] = useReducer(
    selectedReducer, getInitSelectedState(props.selected, props.rows, primaryKey)
  )


  useEffect(() => {
    // when rows change, reindex
    let newRows = indexData(props.rows)

    // need to re-sort if updating table dynamically
    const sortID = Object.keys(sortBy).length ?
      Object.keys(sortBy)[0] : null
    if (sortID) {
      newRows = clientSideSort(newRows, sortID, sortBy[sortID])
    }

    if (pagination) {
      newRows = newRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    }

    setRows(newRows)
  }, [props.rows, page, rowsPerPage])

  // listen to column configs
  useEffect(() => {
    setColumns(getVisibleColumns(props.columns, activeColumns))
  }, [activeColumns, props.columns, storageKey])

  // if column config, or storageKey changes, we need to reset the active columns
  useEffect(() => {
    setActiveColumns(getActiveTableCols(storageKey, props.columns))
  }, [props.columns, storageKey])

  // listen to page changes
  useEffect(() => {
    setPage(Number(props.page))
  }, [props.page])

  // listen to rowsPerPage
  useEffect(() => {
    setRowsPerPage(props.rowsPerPage)
  }, [props.rowsPerPage])

  // listen to sort changes
  useEffect(() => {
    if (!props.sort) return
    setSortBy(parseSort(props.sort))
  }, [props.sort])

  // listen to selected
  useEffect(() => {
    if (!onSelect) return

    onSelect(selected)

    // eslint-disable-next-line
  }, [selected])


  // enable/disable userSelect durring ctrl/shift+click
  const handleKeyDown = useCallback((evt) => {
    if (evt.shiftKey) {
      setUserSelect(false)
    }
  }, [setUserSelect])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])


  useClickOutside(tableRef, () => {
    if (props.disableClickOutside) return
    dispatch({type: 'CLEAR'})
  }, ['button', 'a', 'input', '.ignore-click-outside',
    '.MuiDialog-container', '.MuiAutocomplete-popper', '.mapboxgl-canvas-container'])


  const handlePageChange = (event, newPage) => {
    setPage(newPage)
    if (props.onPage) props.onPage(newPage)
  }

  const handleSelect = (event, rowID, obj) => {
    if (disableRowSelect && disableRowSelect(obj)) {
      return
    }

    let type
    if (event.metaKey) {
      type = 'CTRL_SET'
    } else if (event.shiftKey) {
      type = 'SHIFT_SET'
    } else {
      type = 'SET'
      setAllSelected(false)
    }

    dispatch({type, id: rowID, obj, rows, event})

    // enable text-selection again
    setUserSelect(true)
  }

  const handleSelectAll = () => {
    setAllSelected(prev => {
      if (prev) dispatch({type: 'CLEAR'})
      else dispatch({type: 'SELECT_ALL', rows})
      return !prev
    })
  }

  const handleSort = (colObj) => {
    const {id} = colObj
    const direction = sortBy[id] == 'asc' ? 'dsc' : 'asc'
    const newState = {[id]: direction}

    // if server-side sorting
    if (onSort)
      onSort(decodeSort(newState))

    // client-side sorting
    if (enableSorting) {
      let allRows = indexData(props.rows)
      allRows = clientSideSort(allRows, id, direction)

      const newRows = pagination ?
        allRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : allRows

      setRows(newRows)
      setSortBy(newState)
    }

    // deselect everything
    dispatch({type: 'CLEAR'})
  }

  const onColumnChange = (activeCols) => {
    setActiveColumns(activeCols)
    if (storageKey)
      LS.set(`${STORAGE_PREFEX}${storageKey}`, activeCols.map(o => o.id))
    onColumnMenuChange(activeCols)
  }

  const handleDoubleClick = (evt, row) => {
    if (onDoubleClick) onDoubleClick(evt, row)
  }

  const handleShowDetails = () => {
    if (onShowDetails) onShowDetails()
  }

  const handleDLOption = (getData: () => object[]) => {
    // todo(nc): could add support for other options/formats if needed.
    const header = columns.map(o => o.label).join(', ')
    const rows = (getData ? getData() : props.rows).map(row =>
      columns.map(col => {
        const val = row[col.id]
        return col.dlFormat ? `"${col.dlFormat(val, row)}"` : formatDownloadCol(val)
      })
    )

    const csvStr = `${header}\n${rows.map(v => v ? v.join(',') : '').join('\n')}`

    const blob = strToBlob(csvStr, 'text/csv')
    const blobUrl = URL.createObjectURL(blob)
    window.open(blobUrl)
  }

  return (
    <Root>
      <CtrlContainer>
        {props.leftComponent &&
          props.leftComponent
        }

        {onSearch &&
          <TableSearch
            value={props.search}
            onSearch={onSearch}
            placeholder={props.searchPlaceholder}
          />
        }

        {props.middleComponent &&
          <MiddleComponent>
            {props.middleComponent}
          </MiddleComponent>
        }


        {enableDownload &&
          <TableOption>
            <DownloadTableBtn onDownload={() => handleDLOption(props.getDownloadableData)} />
            <Divider orientation="vertical" flexItem sx={{margin: '5px 15px' }} />
          </TableOption>
        }

        {pagination &&
          <>
            <Pagination
              rowsPerPageOptions={[rowsPerPage]}
              count={props.total || props.limit || rows?.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handlePageChange}
            />
          </>
        }

        {onColumnMenuChange &&
          <TableOption>
            <ColumnMenu
              options={props.columns} // all columns
              value={activeColumns}
              onChange={onColumnChange}
              onRestoreDefaults={() => {
                if (storageKey)
                  LS.rm(`${STORAGE_PREFEX}${storageKey}`)
                setColumns(getVisibleColumns(props.columns))
                setActiveColumns(getActiveTableCols(storageKey, props.columns))
              }}
            />
          </TableOption>
        }

        {props.rightComponent &&
          props.rightComponent
        }

        {onShowDetails &&
          <Tooltip title="Show/hide details" placement="top">
            <IconButton
              onClick={handleShowDetails}
              style={{background: selected.ids.length ? '#ecf4fb' : '#fff'}}
              className="hover"
              disableRipple
            >
              <InfoIcon htmlColor={selected.ids.length ? '#3a8cc2' : ''}/>
            </IconButton>
          </Tooltip>
        }
      </CtrlContainer>

      <Container
        offset={offsetHeight ? offsetHeight : '0px'}
        $stripes={stripes}
        $userselect={userSelect}
      >
        <Table stickyHeader aria-label="table" size="small" ref={tableRef}>
          <TableHead>
            <TableHeadComponent
              columns={columns}
              allSelected={allSelected}
              handleSelectAll={handleSelectAll}
              checkboxes={checkboxes}
              enableSorting
              sortBy={sortBy}
              handleSort={handleSort}
            />
          </TableHead>

          <TableBody>
            <TableRows
              rows={rows}
              columns={columns}
              checkboxes={checkboxes}
              onSelect={handleSelect}
              selected={selected}
              onDoubleClick={handleDoubleClick}
              onMore={props.onMore}
              greyRow={greyRow}
              disableRowSelect={disableRowSelect}
              collapsible={collapsible}
            />
          </TableBody>
        </Table>

        {rows.length == 0 &&
          <NoneFoundNotice>
            {emptyNotice || 'No results found'}
          </NoneFoundNotice>
        }
      </Container>

    </Root>
  )
}




const Root = styled.div`
`

const CtrlContainer = styled.div`
  padding-bottom: 10px;
  display: flex;
  align-items: center;
  flex: 1;

  .MuiTablePagination-actions {
    user-select: none;
  }
`

const MiddleComponent = styled.div`
  flex: 1;
`

const Pagination = styled(TablePagination)`
  .MuiToolbar-root {
    padding-left: 0;
  }
`

type StylingProps = {
  offset?: string | boolean
  $stripes?: boolean
  $userselect?: boolean
}

const Container = styled(TableContainer)<StylingProps>`
  /* remove height of control panel */
  max-height: ${props => `calc(100% - ${props.offset || '60px'})`};
  height: 100%;

  /* handled with stickyHeader */
  border-collapse: separate;

  .on-row-hover {
    visibility: hidden;
  }

  tr:hover .on-row-hover {
    visibility: visible;
  }


  td {
    font-size: 13px;
  }

  ${props => props.$stripes &&
    `& tr:nth-child(odd) {
      background: #fafafa;
    }`}

  td.MuiTableCell-sizeSmall {
    padding: 6px 12px;
  }

  tr.MuiTableRow-root:hover {
    background-color: #f5f5f5;
  }

  tr.MuiTableRow-root.Mui-selected,
  tr.MuiTableRow-root.Mui-selected:hover {
    background-color: #ecf4fb;
  }

  ${props => !props.$userselect &&
    `& tr { user-select: none;
     background#b7b7b7fa; }`}

  /* todo(nc): workaround for production build styling issue.
    similar to: https://github.com/gregnb/mui-datatables/issues/1074 */
  th {
    top: 0;
    left: 0;
    z-index: 2;
    position: sticky;
    background-color: #fff;
    user-select: none;
    padding: 0px 12px 6px 12px;
    font-weight: 800;
  }
`

const TableOption = styled.div`
  display: flex;
  margin-left: auto;
`

const NoneFoundNotice = styled.div`
  display: flex;
  justify-content: center;
  transform: translate(0%, 20%);
  color: #666;
  font-size: 1.5em;
  margin: 100px 0;
`
