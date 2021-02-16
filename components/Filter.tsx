import React from 'react'
import styled from 'styled-components'
import TextField from '@material-ui/core/TextField'
import Autocomplete from '@material-ui/lab/Autocomplete'


type Option = {id: string, label: string}

type Ops = 'SET_FILTER' | 'CLEAR_FILTER'

type FilterProps = {
  id: string
  label: string
  options: Option[]
  width?: number
  onChange: (action: Ops, field: string, val?: Option) => void
}


function Filter(props: FilterProps) {
  const {id, label, options, width, onChange} = props

  return (
    <FilterContainer autoComplete="off" onSubmit={evt => evt.preventDefault()}>
      <Autocomplete
        id={`sage-filter-${label}`}
        options={options}
        getOptionLabel={(option) => option.label}
        style={{width: width || 150}}
        onChange={(evt, val) => {
          if (val) onChange('SET_FILTER', id, val['label'])
          else onChange('CLEAR_FILTER', id)
        }}
        size="small"
        renderInput={(params) =>
          <TextField {...params} label={label} variant="outlined" autoComplete='off' />
        }
      />
    </FilterContainer>
  )
}

const FilterContainer = styled.form`
  margin-left: 20px;
`


export default Filter

