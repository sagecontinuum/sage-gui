import styled from 'styled-components'
import { Chip } from '@mui/material'
import { defaultPrompt } from './default-job'


type Props = {
  onClick: (val: string) => void
}

export default function DefaultPrompts(props: Props) {
  const {onClick} = props

  const handleClick = (evt) => {
    onClick(evt.target.innerText)
  }


  return (
    <Root className="flex gap">
      <Chip label={defaultPrompt} onClick={handleClick} />
      <Chip label="What are the objects in the view?" onClick={handleClick} />
      <Chip label="Is there anything unusual or dangerous?" onClick={handleClick} />
    </Root>
  )
}


const Root = styled.div`

  margin-right: 50px;
`