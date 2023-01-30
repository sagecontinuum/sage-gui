import { useState, memo, useRef } from 'react'
import styled from 'styled-components'

import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import CopyIcon from '@mui/icons-material/FileCopyOutlined'
import DoneIcon from '@mui/icons-material/DoneOutlined'


type Props = {
  tooltip: string | React.FC
  onClick: () => void
}

export default function CopyBtn(props: Props) {
  const {tooltip, onClick} = props

  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = () => {
    onClick()
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <Tooltip title={isCopied ? 'Copied!' : tooltip}>
      <CopyButton onClick={() => handleCopy()} size="small">
        {isCopied ? <DoneIcon />  : <CopyIcon />}
      </CopyButton>
    </Tooltip>
  )
}


const CopyButton = styled(IconButton)`
  position: absolute;
  right: 0;
  top: 0;
  background: inherit;

  :hover {
    background: #ddd;
  }
`