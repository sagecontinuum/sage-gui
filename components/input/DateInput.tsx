import { memo } from 'react'
import styled from 'styled-components'

import { format } from 'date-fns'

type Props = {
  value: Date
  name?: string
  min?: string
  max?: string
  onChange: (date: Date) => void
}

export default memo(function DateInput(props: Props) {
  const { value, name, min, max, onChange } = props

  const handleChange = (evt) => {
    const val = evt.target.value
    const dt = new Date(val)
    const date = new Date(dt.valueOf() + dt.getTimezoneOffset() * 60 * 1000)
    onChange(new Date(date))
  }

  return (
    <Root>
      <input
        type="date"
        name={name}
        value={format(value, 'yyyy-MM-dd')}
        min={min}
        max={max || format(new Date(), 'yyyy-MM-dd')}
        onChange={handleChange}
      />
    </Root>
  )
}, (prev, next) => prev.value == next.value)


const Root = styled.div`
  input[type="date"] {
    padding: 3px 5px ;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 4px;
  }
`


