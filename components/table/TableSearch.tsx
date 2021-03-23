
import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import SearchIcon from '@material-ui/icons/SearchOutlined'
import TextField from '@material-ui/core/TextField'
import InputAdornment from '@material-ui/core/InputAdornment'

import useDebounce from '../hooks/useDebounce'

type Props = {
  value: string
  placeholder?: string
  onSearch: ({query: string}) => void
  [rest: string]: any
}

export default function TableSearch(props: Props) {
  const {onSearch, placeholder, ...rest} = props

  const [query, setQuery] = useState(props.value || '')
  const debounceQuery = useDebounce(query, 300)

  useEffect(() => {
    onSearch({query})
  }, [debounceQuery])

  useEffect(() => {
    setQuery(props.value)
  }, [props.value])

  return (
    <>
      <Search
        placeholder={placeholder || 'Search'}
        value={query}
        onChange={e => { setQuery(e.target.value) }}
        InputProps={{
          style: { width: rest.width || '230px'},
          startAdornment: <InputAdornment position="start"><SearchIcon/></InputAdornment>,
        }}
        size="small"
        variant="outlined"
        {...rest}
      />
    </>
  )
}


const Search = styled(TextField)`
  .MuiOutlinedInput-adornedStart {
    padding-left: 8px;
  }
`