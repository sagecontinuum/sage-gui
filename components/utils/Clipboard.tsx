import { useRef } from 'react'
import { styled } from '@mui/material'

import CopyBtn from './CopyBtn'


type Props = {
  content: JSX.Element | string
  tooltip?: string
}

export default function Clipboard(props: Props) {
  const {content, tooltip = 'Copy content'} = props

  const ref = useRef(null)

  const handleCopy = () => {
    navigator.clipboard.writeText(ref.current.innerText)
  }

  return (
    <Root className="code text-xs">
      <div ref={ref} className="clipboard-content">
        {content}
      </div>

      <BtnContainer>
        <CopyBtn tooltip={tooltip} onClick={() => handleCopy()} />
      </BtnContainer>
    </Root>
  )
}

const Root = styled('pre')`
  position: relative;
  padding-bottom: 0px !important;

  .clipboard-content {
    overflow-x: scroll;
    padding-bottom: 15px;
  }

  background: ${({ theme }) => theme.palette.mode === 'dark' ? '#1e1e1e' : '#f8f8f8'};
  border: 1px solid ${props => props.theme.palette.divider};
`

const BtnContainer = styled('div')`
  position: absolute;
  right: 0;
  top: 0;
`


