import React, {useState, useEffect} from 'react'
import styled from 'styled-components'

import IconButton from '@material-ui/core/IconButton'
import Button from '@material-ui/core/Button'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import TextField from '@material-ui/core/TextField'

import SearchIcon from '@material-ui/icons/SearchOutlined'

import highlightText from './text'
import Checkbox from '@material-ui/core/Checkbox'


// number of rows shown by default for each facet
const MAX_FILTERS = 10


const sortOptions = (options, checked) =>
  [
    ...options.filter(obj => checked.includes(obj.name)),
    ...options.filter(obj => !checked.includes(obj.name))
      .sort((a, b) => b.count - a.count)
  ]


type Props = {
  title: string
  data: {name: string, count: number}[]
  type?: string
  checked: string[]
  onCheck: (val: string) => void
  hideSearch?: boolean
  hideSelectAll?: boolean
}

export default function Filter(props: Props) {
  const {
    title, type, onCheck, hideSearch, hideSelectAll
  } = props


  const [allData, setAllData] = useState(props.data)
  const [data, setData] = useState([])    // filtered data

  const [checked, setChecked] = useState(props.checked)
  const [showAll, setShowAll] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [selectAll, setSelectAll] = useState(false)
  const [showUndo, setShowUndo] = useState(false)

  // query in search field
  const [query, setQuery] = useState('')

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
      obj.name.toLowerCase().includes(query.toLowerCase())
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


  const handleCheck = (value) => {
    onCheck(value)
  }

  const handleShowAll = () => {
    setShowAll(!showAll)
  }

  const handleSelectAll = () => {
  }

  const onSubmitRange = (evt) => {
    evt.preventDefault()
  }


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
              onChange={handleSelectAll}
              size="small"
              color="primary"
              indeterminate={showUndo && !selectAll}
            />
          }

          <b style={hideSelectAll ? {marginLeft: 34} : {}}>
            {title}
          </b>
        </Title>

        {!hideSearch &&
          <SearchBtn onClick={() => setShowSearch(!showSearch)} size="small" autoFocus disableRipple>
            <SearchIcon/>
          </SearchBtn>
        }
      </Header>

      {showSearch &&
        <TextField
          autoFocus
          placeholder={`Filter ${title}`}
          onChange={evt => setQuery(evt.target.value)}
          InputProps={{
            style: {margin: '5px 10px', height: 26}
          }}
          variant="outlined"
        />
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
        {data.slice(0, showAll ? data.length : MAX_FILTERS)
          .map(({name, count}) =>
            <div key={name}>
              <CBContainer
                control={
                  <Checkbox
                    color="primary"
                    size="small"
                    checked={checked.includes(name)}
                    onChange={() => handleCheck(name)}
                  />
                }
                label={
                  <>
                    <FacetLabel>
                      {highlightText(name, query)}
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

      {allData && data.length > MAX_FILTERS &&
        <MoreBtn onClick={handleShowAll}>
          {!showAll && `${data.length - MAX_FILTERS} more…`}
          {showAll && 'less…'}
        </MoreBtn>
      }
    </>
      }
    </FilterRoot>
  )
}


const FilterRoot = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
  padding: 0 5px;


  .MuiCheckbox-root {
    padding: 2px 5px;
  }
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e9e9e9;
  margin: 5px 0;
  padding-bottom: 5px;
`

const Title = styled.div`

`
const Filters = styled.div`

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

const FacetLabel = styled.div`
  font-size: .9rem;
`

const Count = styled.div`
  color: #888;
  font-size: .8rem;
`

const SearchBtn = styled(IconButton)`
  &.MuiButtonBase-root {
    margin-right: 5px;
  }
`

const MoreBtn = styled.a`
  display: flex;
  margin-left: auto;
  margin-right: 10px;
  font-size: .9em;
`

const NoneFound = styled.div`
  margin: 0 20px;
`

/* ranges are not currently supported
const RangeForm = styled.form`
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