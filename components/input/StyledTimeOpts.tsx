import { styled } from '@mui/material'

const TimeOpts = styled('div')`
  display: flex;

  .MuiInputBase-root,
  .MuiButtonBase-root {
    height: 29px;
    border-radius: 5px;
  }

  .MuiButtonBase-root,
  .react-datetimerange-picker__wrapper {
    min-width: 30px;
    border-color: ${({theme}) =>  theme.palette.mode == 'dark' ?
    theme.palette.grey[700] : theme.palette.grey[400]} !important;
  }

  .MuiButtonBase-root:hover,
  .react-datetimerange-picker__wrapper:hover {
    border-color: ${({theme}) => theme.palette.mode == 'dark' ?
    theme.palette.grey[100] : theme.palette.text.primary} !important;
  }

  .MuiCircularProgress-root {
    position: absolute
  }
`

export default TimeOpts