import styled from 'styled-components'

import { TextField, Button } from '@mui/material'
import CaretIcon from '@mui/icons-material/ExpandMoreRounded'

import FilterMenu from '/components/FilterMenu'



export default function SuccessBuilder(props) {

  const {amount, unit, onChange} = props

  return (
    <Root>
      <div className="flex items-center gap">
        <h4>Runtime is</h4>

        <TextField
          value={amount}
          className="runtime-input"
          onChange={evt => onChange('amount', evt.target.value)}
        />
        <FilterMenu
          options={[
            {id: 'min', label: 'Minute'},
            {id: 'hour', label: 'Hour'},
            {id: 'day', label: 'Day'},
            {id: 'month', label: 'Month'}
          ]}
          multiple={false}
          onChange={(val) => onChange('unit', val.id)}
          value={{id: unit, label: unit}}
          ButtonComponent={
            <Button>{unit} <CaretIcon /></Button>
          }
        />
      </div>
    </Root>
  )
}

const Root = styled.div`
  .runtime-input {
    width: 100px;
  }
`
