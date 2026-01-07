import { useState, useEffect, ChangeEvent } from 'react'
import { styled } from '@mui/material'

import IconButton from '@mui/material/IconButton'
import FormControlLabel from '@mui/material/FormControlLabel'
import TextField from '@mui/material/TextField'

import { SearchOutlined } from '@mui/icons-material'

import highlightText from '/components/utils/text'
import Checkbox from '/components/input/Checkbox'


// number of rows shown by default for each facet
const DEFAULT_SHOWN = 10


const sortOptions = (options, checked) =>
  [
    ...options.filter(obj => checked.includes(obj.name)),
    ...options.filter(obj => !checked.includes(obj.name))
      .sort((a, b) => b.count - a.count)
  ]


type Props = {
  title: string
  data: {name: string, count: number}[]
  checked: string[]
  hideSearchIcon?: boolean
  hideSelectAll?: boolean
  defaultShown?: number
  showSearchBox?: boolean
  onCheck: (evt: ChangeEvent<HTMLInputElement>, val: string) => void
  onSelectAll: (evt: ChangeEvent<HTMLInputElement>, val: string[]) => void
}

export default function Filter(props: Props) {
  const {
    title,
    hideSearchIcon,
    hideSelectAll,
    defaultShown,
    showSearchBox = false,
    onCheck,
    onSelectAll
  } = props

  const [allData, setAllData] = useState(props.data)
  const [data, setData] = useState([])    // filtered data

  const [checked, setChecked] = useState(props.checked)
  const [showAll, setShowAll] = useState(false)
  const [showSearch, setShowSearch] = useState(showSearchBox)
  const [selectAll, setSelectAll] = useState(false)
  const [showUndo, setShowUndo] = useState(false)

  // query in search field
  const [query, setQuery] = useState('')

  const shownCount = defaultShown || DEFAULT_SHOWN

  // update facets
  useEffect(() => {
    setAllData(props.data)
  }, [props.data])

  // update checked facets
  useEffect(() => {
    setChecked(props.checked)
  }, [props.checked])

  // effect for filtering data (currently client-side)
  useEffect(() => {
    if (!allData) return

    const filteredData = allData.filter(obj =>
      obj.name?.toLowerCase().includes(query.toLowerCase())
    )

    // sort checked to the top, and sort rest
    setData(sortOptions(filteredData, checked))

    // watch checked for indeterminate state
    const l = checked.length
    if (l > 0 && l < allData.length) {
      setShowUndo(true)
      setSelectAll(false)
    } else if (l == 0) {
      setShowUndo(false)
      setSelectAll(false)
    } else if (l == allData.length ) {
      setSelectAll(true)
    }
  }, [query, allData, checked])


  const handleCheck = (evt, value) => {
    onCheck(evt, value)
  }

  const handleShowAll = () => {
    setShowAll(!showAll)
  }

  const handleSelectAll = (evt) => {
    onSelectAll(evt, props.data.map(o => o.name))
  }

  // const onSubmitRange = (evt) => {
  //   evt.preventDefault()
  //


  // only render if there's actually facet data
  if (!props.data) return <></>

  return (
    <FilterRoot>
      {allData && allData.length > 0 &&
    <>
      <Header>
        <Title>
          {!hideSelectAll &&
            <Checkbox
              checked={selectAll}
              onChange={(evt) => handleSelectAll(evt)}
              indeterminate={showUndo && !selectAll}
            />
          }

          <b style={hideSelectAll ? {marginLeft: 34} : {}}>
            {title}
          </b>
        </Title>

        {!hideSearchIcon &&
          <IconButton onClick={() => setShowSearch(!showSearch)} size="small" autoFocus>
            <SearchOutlined />
          </IconButton>
        }
      </Header>

      {showSearch &&
        <div style={{margin: '5px 0 5px 10px'}}>
          <TextField
            autoFocus
            placeholder={`Filter ${title}`}
            onChange={evt => setQuery(evt.target.value)}
            fullWidth
            variant="outlined"
            slotProps={{
              input: {
                style: {height: 26}
              }
            }}
          />
        </div>
      }

      {/* ranges are not currently supported
      {type == 'number' &&
        <RangeForm  onSubmit={onSubmitRange}>
          <div className="flex align-items-center">
            <TextField
              placeholder="Min"
              value={range.min}
              onChange={evt => setRange({min: evt.target.value, max: range.max})}
              InputProps={{
                style: {margin: '5px 10px', height: 26, width: 70}
              }}
              variant="outlined"
            />

            <span>to</span>

            <TextField
              placeholder="Max"
              value={range.max}
              onChange={evt => setRange({max: evt.target.value, min: range.min})}
              InputProps={{
                style: {margin: '5px 5px', height: 26, width: 70}
              }}
              variant="outlined"
            />

            <RangeSubmitBtn
              type="submit"
              size="small"
              color="primary"
              variant="contained"
              disableRipple
            >
              Go
            </RangeSubmitBtn>
          </div>
        </RangeForm>
      }
      */}

      <Filters>
        {data.slice(0, showAll ? data.length : shownCount)
          .map(({name, count, icon}) =>
            <div key={name}>
              <CBContainer
                control={
                  <Checkbox
                    name={name}
                    checked={checked.includes(name)}
                    onChange={(evt) => handleCheck(evt, name)}
                  />
                }
                label={
                  <>
                    <FacetLabel>
                      {highlightText(name, query)}
                      {icon}
                    </FacetLabel>
                    <Count>
                      {count.toLocaleString()}
                    </Count>
                  </>
                }
              />
            </div>
          )
        }

        {data.length == 0 &&
          <NoneFound className="muted">none found</NoneFound>
        }
      </Filters>

      {allData && data.length > shownCount &&
        <MoreBtn onClick={handleShowAll}>
          {!showAll && `${data.length - shownCount} more…`}
          {showAll && 'less…'}
        </MoreBtn>
      }
    </>
      }
    </FilterRoot>
  )
}


const FilterRoot = styled('div')`
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
  padding: 0 5px;
`

const Header = styled('div')`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${props => props.theme.palette.divider};
  margin: 5px 0;
  padding-bottom: 5px;
`

const Title = styled('div')`

`
const Filters = styled('div')`

`
const CBContainer = styled(FormControlLabel)`
  &.MuiFormControlLabel-root {
    width: 225px;
    margin-left: 0;
  }
  &.MuiFormControlLabel-root:hover * {
    font-weight: bold;
  }

  & .MuiTypography-root {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`

const FacetLabel = styled('div')`
  font-size: .9rem;
`

const Count = styled('div')`
  color: #888;
  font-size: .8rem;
`

const MoreBtn = styled('a')`
  display: flex;
  margin-left: auto;
  margin-right: 10px;
  font-size: .9em;
`

const NoneFound = styled('div')`
  margin: 0 20px;
`

/* ranges are not currently supported
const RangeForm = styled('form')`
  margin-bottom: 5px;
`

const RangeSubmitBtn = styled(Button)`
  &.MuiButton-root {
    margin-left: 5px;
    min-width: 10px;
    height: 26px;
  }
`
*/