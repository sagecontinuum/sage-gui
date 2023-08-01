import styled from 'styled-components'
import Alert from '@mui/material/Alert'

type Props = {
  children: React.ReactNode
}

export default function ErrorMsg(props: Props) {
  return (
    <Root>
      <Alert severity="error">
        {props.children}
      </Alert>
    </Root>
  )
}


const Root = styled.div`
  margin-top: 20px;
`
