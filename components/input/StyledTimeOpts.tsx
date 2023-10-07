import styled from 'styled-components'

const TimeOpts = styled.div`
  display: flex;

  .MuiInputBase-root,
  .MuiButtonBase-root {
    height: 29px;
    border-radius: 5px;
  }

  .MuiButtonBase-root {
    min-width: 30px;
    color: #fff;
    border-color: #c4c4c4;
  }

  .MuiButtonBase-root:hover {
    border-color: #212121
  }

  .MuiCircularProgress-root {
    position: absolute
  }
`

export default TimeOpts