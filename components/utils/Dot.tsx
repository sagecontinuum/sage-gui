import styled from 'styled-components'

const Dot = styled.div<{color?: string, size?: string}>`
  display: inline-block;
  height: ${props => props.size || '12'}px;
  width:  ${props => props.size || '12'}px;
  border-radius: 50%;
  margin-right: 3px;
  background-color: ${props => props.color || 'rgb(28, 140, 201)'};
`

export default Dot