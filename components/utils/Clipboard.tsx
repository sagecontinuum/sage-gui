import { useRef } from 'react'
import styled from 'styled-components'

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

      <CopyBtn tooltip={tooltip} onClick={() => handleCopy()} />
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


