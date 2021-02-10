
import React, { useState, useEffect, useRef, useCallback} from 'react'
import styled from 'styled-components'
import SearchIcon from '@material-ui/icons/SearchOutlined'
import TextField from '@material-ui/core/TextField'
import InputAdornment from '@material-ui/core/InputAdornment'

import useDebounce from '../hooks/useDebounce'

type Props = {
  value: string
  searchPlaceholder: string
  onSearch: ({query: string}) => void
}

export default function TableControls(props: Props) {
  const {value, onSearch, searchPlaceholder} = props

  const [query, setQuery] = useState(value || '')
  const debounceQuery = useDebounce(query, 300)

  useEffect(() => {
    onSearch({query})
  }, [debounceQuery])

  return (
    <>
      <Search
        placeholder={searchPlaceholder || 'Search'}
        // value={value}
        onChange={e => { setQuery(e.target.value) }}
        InputProps={{
          style: { width: '230px'},
          startAdornment: <InputAdornment position="start"><SearchIcon/></InputAdornment>,
        }}
        size="small"
        variant="outlined"
      />
    </>
  )
}


const Search = styled(TextField)`
  .MuiOutlinedInput-adornedStart {
    padding-left: 8px;
  }
`