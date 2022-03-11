import { useState, memo, useRef } from 'react'
import styled from 'styled-components'

import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import CopyIcon from '@mui/icons-material/FileCopyOutlined'
import DoneIcon from '@mui/icons-material/DoneOutlined'

type Props = {
  content: JSX.Element | string
  tooltip?: string
}

export default function Clipboard(props: Props) {
  const {content, tooltip = 'Copy content'} = props

  const ref = useRef(null)
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(ref.current.innerText)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <Root className="code text-xs">
      <div ref={ref} className="clipboard-content">
        {content}
      </div>

      <Tooltip title={isCopied ? 'Copied!' : tooltip}>
        <CopyBtn onClick={() => handleCopy()} size="small">
          {isCopied ? <DoneIcon />  : <CopyIcon />}
        </CopyBtn>
      </Tooltip>
    </Root>
  )
}

const Root = styled.pre`
  position: relative;
  padding-bottom: 0px !important;

  .clipboard-content {
    overflow-x: scroll;
    padding-bottom: 15px;
  }
`

const CopyBtn = styled(IconButton)`
  position: absolute;
  right: 0;
  top: 0;
  background: inherit;

  :hover {
    background: #ddd;
  }
`
