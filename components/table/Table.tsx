import React, {
  useState, useEffect, useReducer,
  useRef, useCallback,
  MouseEvent, ChangeEvent
} from 'react'

import styled from 'styled-components'

import TableContainer from '@material-ui/core/TableContainer'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TablePagination from '@material-ui/core/TablePagination'
import TableRow from '@material-ui/core/TableRow'
import Tooltip from '@material-ui/core/Tooltip'
import IconButton from '@material-ui/core/IconButton'
import Divider from '@material-ui/core/Divider'

import MoreIcon from '@material-ui/icons/MoreVert'
import InfoIcon from '@material-ui/icons/InfoOutlined'
import ArrowDown from '@material-ui/icons/ArrowDropDown'
import ArrowUp from '@material-ui/icons/ArrowDropUp'

import ColumnMenu from './ColumnMenu'
import TableSearch from './TableSearch'

import selectedReducer, { SelectedState, initialSelectedState } from './selectedReducer'
import useClickOutside from '../hooks/useClickOutside'

export { SelectedState }

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
  rows: object[]
  columns: object[]
  row: object,
  id: number,
  emptyCell: boolean,
  selected: any, //todo: type
  // checkboxes: boolean,
  onSelect?: (
    evt: MouseEvent<HTMLElement> | ChangeEvent<HTMLInputElement>,
    id: number,
    row: object
  ) => void
  onDoubleClick: (evt: MouseEvent, row: object) => void
  onMore?: () => void
  greyRow?: (row: object) => boolean
}

const Row = (props: RowProps) => {
  const {
    columns,
    row,
    id,
    emptyCell,
    selected,
    //checkboxes,
    onSelect,
    onDoubleClick,
    onMore,
    greyRow
  } = props

  // @ts-ignore
  const {rowID} = row

  return (
    <TableRowComponent hover
      className={greyRow(row) && 'grey'}
      tabIndex={-1}
      key={id}
      onClick={evt => onSelect(evt, rowID, row)}
      onDoubleClick={evt => onDoubleClick(evt, row)}
      selected={selected.ids.includes(rowID)}
    >
      {emptyCell && <Cell></Cell>}

      {/*checkboxes &&
        <Cell key={id + '-checkbox'} style={{padding: 0, width: 1}}>
          <Checkbox
            checked={selected.ids.includes(rowID)}
            onClick={evt => onSelect(evt, rowID, row)}
          />
        </Cell>
        */
      }

      <RowCells
        columns={columns}
        row={row}
      />

      {onMore &&
        <More className="more-btn">
          <IconButton size="small">
            <MoreIcon />
          </IconButton>
        </More>
      }
    </TableRowComponent>
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
      {/* if table has checkboxes (if table has sslect all checkbox) */}
      {/*checkboxes &&
        <TableCell style={{padding: 0, width: 1}} onClick={handleSelectAll}>
          <Checkbox checked={allSelected} />
        </TableCell>
      *}

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


const clientSideSort = (data, id, direction) => {
  const isArrayCol = Array.isArray(data[0][id])
  const isNumeric = typeof data[0][id] === 'number'

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
        a[id].toString().localeCompare(b[id].toString(), undefined, {numeric: true}) :
        b[id].toString().localeCompare(a[id].toString(), undefined, {numeric: true})
    )
  } else {
    data.sort((a, b) =>
      direction == 'asc' ?
        a[id].localeCompare(b[id])
        : b[id].localeCompare(a[id])
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


// initial state of columns includes "hide", then shown columns
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
  columns: object[]
  page?: number | string  // for ajax pagination
  limit?: number          // for ajax pagination
  total?: number          // for ajax pagination
  search?: string
  sort?: object
  emptyNotice?: string
  pagination?: boolean
  offsetHeight?: string | boolean
  checkboxes?: boolean
  searchPlaceholder?: string
  stripes?: boolean
  enableSorting?: boolean

  onSearch?: ({query: string}) => void
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

  middleComponent?: JSX.Element
  rightComponent?: JSX.Element
}


type Row = { rowID: number }
type Rows = Row[]



export default function TableComponent(props: Props) {
  const {
    primaryKey = 'rowID',
    pagination, offsetHeight, checkboxes, emptyNotice,
    middleComponent, rightComponent, stripes = true, enableSorting = false,
    onSearch, onSort, onSelect, onDoubleClick, onColumnMenuChange,
    onShowDetails,
    greyRow = () => false,
    disableRowSelect = () => false
  } = props

  if (pagination && (props.page === undefined || !props.limit)) {
    throw `Grid component must provide 'page' and 'limit' when 'pagination' is used.
      page value was: ${props.page}; limit value was: ${props.limit}.`
  }

  const tableRef = useRef(null)

  const [rows, setRows] = useState<Rows>(props.rows.map((row, i) => ({...row, rowID: i})))
  const [columns, setColumns] = useState(getVisibleColumns(props.columns))
  const [page, setPage] = useState(Number(props.page))
  const [sortBy, setSortBy] = useState((props.sort && parseSort(props.sort)) || {})
  const [rowsPerPage] = useState(200)

  // keep state on shown/hidden columns
  // initial columns are defined in `columns` spec.
  const [activeColumns, setActiveColumns] = useState(null)

  // disable user-select when shift+click is happening
  const [userSelect, setUserSelect] = useState(true)

  // selected/checkbox state
  const [allSelected, setAllSelected] = useState<boolean>(false)
  const [selected, dispatch] = useReducer(selectedReducer, initialSelectedState)


  // when rows change, add row ids
  useEffect(() => {
    let newRows = props.rows.map((row, i) => ({...row, rowID: row[primaryKey]}))

    // need to re-sort if updating table dynamically
    const sortID = Object.keys(sortBy).length ?
      Object.keys(sortBy)[0] : null
    if (sortID) {
      newRows = clientSideSort(newRows, sortID, sortBy[sortID])
    }

    setRows(newRows)
  }, [props.rows])

  // listen to columns
  useEffect(() => {
    setColumns(getVisibleColumns(props.columns, activeColumns))
  }, [activeColumns, props.columns])

  // listen to page changes
  useEffect(() => {
    setPage(Number(props.page))
  }, [props.page])

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
    dispatch({type: 'CLEAR'})
  }, ['button', 'a', 'input', '.ignore-click-outside',
    '.MuiDialog-container', '.MuiAutocomplete-popper'])


  const onChangePage = (event, newPage) => {
    setPage(newPage)
    props.onPage(newPage)
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
      setRows(clientSideSort(rows, id, direction))
      setSortBy(newState)
    }

    // deselect everything
    dispatch({type: 'CLEAR'})
  }

  const onColumnChange = (activeCols) => {
    setActiveColumns(activeCols)
    onColumnMenuChange(activeCols)
  }

  const handleDoubleClick = (evt, row) => {
    if (onDoubleClick) onDoubleClick(evt, row)
  }

  const handleShowDetails = () => {
    if (onShowDetails) onShowDetails()
  }

  return (
    <Root>
      <CtrlContainer>
        {onSearch &&
          <TableSearch
            value={props.search}
            onSearch={onSearch}
            placeholder={props.searchPlaceholder}
          />
        }

        {middleComponent &&
          middleComponent
        }

        {pagination &&
          <>
            <Pagination
              labelRowsPerPage={''}
              rowsPerPageOptions={[rowsPerPage]}
              component="div"
              rowsPerPage={props.limit}
              page={page}
              backIconButtonProps={{
                disableRipple: true,
                'aria-label': 'previous page',
                style: {marginLeft: '2px'}
              }}
              nextIconButtonProps={{
                disableRipple: true,
                'aria-label': 'next page',
              }}
              count={props.total || (rows && rows.length) || 0}
              onChangePage={onChangePage}
            />
            <Divider orientation="vertical" flexItem style={{margin: '10px 5px'}} />
          </>
        }

        {onColumnMenuChange &&
          <div style={{marginLeft: 'auto'}}>
            <ColumnMenu
              options={props.columns} // all columns
              onChange={onColumnChange}
            />
          </div>

        }

        {rightComponent &&
          rightComponent
        }

        {onShowDetails &&
          <Tooltip title="Show/hide details" placement="top">
            <IconButton
              size="small"
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
        offset={offsetHeight ? offsetHeight : 0}
        stripes={stripes ? 1 : 0}
        userselect={userSelect ? 1 : 0}
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
            />
          </TableBody>
        </Table>

        {rows.length == 0 &&
          <NoneFoundNotice offset={offsetHeight}>
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
  border-bottom: 2px solid #f2f2f2;
  padding-bottom: 10px;
  display: flex;
  align-items: center;
  flex: 1;
`


const Pagination = styled(TablePagination)`
  flex: 1;

  & .MuiTablePagination-actions {
    user-select: none;
    margin: 0;
  }
  && .MuiToolbar-root {
    padding-right: 0;
  }
`

const Container = styled(TableContainer)`
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
    /* if using ellipsis
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 0;
    */

    font-size: 13px;
  }

  ${props => props.stripes ?
    `& tr:nth-child(odd) {
      background: #fafafa;
    }` : ''}

  td.MuiTableCell-sizeSmall {
    padding: 6px 12px 6px 6px;
  }
  th.MuiTableCell-sizeSmall {
    padding: 1px 15px 6px 6px;
  }

  tr.MuiTableRow-root:hover {
    background-color: #f5f5f5;
  }

  tr.MuiTableRow-root.Mui-selected,
  tr.MuiTableRow-root.Mui-selected:hover {
    background-color: #ecf4fb;
  }

  ${props => !props.userselect ?
    'user-select: none;' : ''}

  /* todo(nc): workaround for production build styling issue.
    similar to: https://github.com/gregnb/mui-datatables/issues/1074 */
  th {
    top: 0;
    left: 0;
    z-index: 2;
    position: sticky;
    background-color: #fff;
    user-select: none;
    padding: 6px 12px 6px 2px;
    font-weight: 800;
  }
`

const NoneFoundNotice = styled.div`
  height: ${props => `calc(100% - ${props.offset || '500px'})`};
  display: flex;
  justify-content: center;
  transform: translate(0%, 20%);
  color: #666;
  font-size: 1.5em;
`
