import { useState, memo } from 'react'
import styled from 'styled-components'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import SearchIcon from '@mui/icons-material/SearchOutlined'
import ClearIcon from '@mui/icons-material/ClearOutlined'

import useDebounce from '/components/hooks/useDebounce'

type Props = {
  value?: string
  placeholder?: string
  width?: React.CSSProperties['width']
  onSearch: (val: {query: string}) => void
}

export default memo(function TableSearch(props: Props) {
  const {onSearch, placeholder, width} = props

  const [query, setQuery] = useState(props.value || '')

  const handleChange = () => {
    onSearch({query})
  }

  const debouncedOnChange = useDebounce(handleChange)

  return (
    <>
      <Search
        placeholder={placeholder || 'Search'}
        value={query}
        onChange={(e) => {
          debouncedOnChange()
          setQuery(e.target.value)
        }}
        InputProps={{
          style: { width: width || '275px'},
          startAdornment: <InputAdornment position="start"><SearchIcon/></InputAdornment>,
          endAdornment:
            query.length > 0 &&
              <IconButton
                size="small"
                onClick={() => { debouncedOnChange(); setQuery('') }}
              >
                <ClearIcon fontSize="small"/>
              </IconButton>
        }}
        size="small"
        variant="outlined"
      />
    </>
  )
}, (prev, next) => prev.value == next.value)


const Search = styled(TextField)`
  .MuiOutlinedInput-adornedStart {
    padding-left: 8px;
  }
`