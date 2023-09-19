import styled from 'styled-components'

import DateTimePicker, { type DateTimeRangePickerProps } from '@wojtekmaj/react-datetimerange-picker'
import '@wojtekmaj/react-datetimerange-picker/dist/DateTimeRangePicker.css'
import 'react-calendar/dist/Calendar.css'


export default function DateRangePicker(props: DateTimeRangePickerProps) {
  return (
    <Root>
      <DateTimePicker
        clearIcon={false}
        maxDate={new Date()}
        maxDetail="second"
        rangeDivider="to"
        disableClock
        {...props}
      />
    </Root>
  )
}



const Root = styled.div`
  white-space: nowrap;

  input[type=number]::-webkit-outer-spin-button,
  input[type=number]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  select {
    -webkit-appearance: none;
  }

  .react-calendar__tile--now {
    background: #f2f2f2;
  }

  [class*=-picker__calendar--open] {
    left: 50px !important;
    z-index: 5000;
    box-shadow: 0px -1px 10px 1px rgba(0,0,0,.2);
    border: none;
  }

  [class*=-picker__wrapper] {
    border: 1px solid #c4c4c4;
    border-radius: 5px;
    margin: 0 10px 0 20px;
  }

  [class*=-picker__wrapper]:hover {
    border-color: #ddd;
  }

  [class*=-picker__range-divider] {
    margin: 0 10px;
  }

  .react-calendar__tile--range {
    background: #006edc;
    color: #f2f2f2;
    font-weight: bold;
  }

  .react-calendar__tile--rangeStart {
    border-radius: 50px 0 0 50px;
  }

  .react-calendar__tile--rangeEnd {
    border-radius: 0 50px 50px 0;
  }

  .react-calendar__tile--rangeBothEnds {
    border-radius: 50px;
  }

  .react-calendar__tile--active {
    color: #fff;
    background: #3789dc;
  }

  [class*=react-calendar__navigation],
  .react-calendar abbr {
    font-weight: 600;
  }
`

