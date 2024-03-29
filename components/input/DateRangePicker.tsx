import styled from 'styled-components'
import CalendarMonth from '@mui/icons-material/CalendarMonth'

import DatePicker, { type DateRangePickerProps } from '@wojtekmaj/react-daterange-picker'
import '@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css'
import 'react-calendar/dist/Calendar.css'


export default function DateRangePicker(props: DateRangePickerProps) {
  return (
    <Root>
      <DatePicker
        clearIcon={false}
        maxDate={new Date()}
        rangeDivider="to"
        showLeadingZeros
        calendarIcon={<CalendarMonth color="action" />}
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

  .react-daterange-picker__clear-button {
    display: none;
  }

  [class*=-picker__calendar--open] {
    position: absolute;
    top: 60px;
    z-index: 5000;
    box-shadow: 0px -1px 10px 1px rgba(0,0,0,.2);
    border: none;
  }

  [class*=-picker__wrapper] {
    border: 1px solid #c4c4c4;
    border-radius: 5px;
    margin: 0 10px 0 10px;
  }

  [class*=-picker__wrapper]:hover {
    border-color: #212121;
  }

  [class*=-picker__range-divider] {
    margin: 0 5px;
  }
  [class*=-picker__calendar-button] {
    padding: 1px 2px 2px 0;
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

