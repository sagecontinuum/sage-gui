
import styled from 'styled-components'


const Sidebar = styled.div<{width?: string}>`
  position: sticky;
  top: 60px;
  height: calc(100vh);
  padding-top: 10px;
  width: ${props => props.width || '250px'};
  min-width: ${props => props.width || '250px'};
  border-right: 1px solid #f1f1f1;
  background: #f8f8f8;
  overflow-y: scroll;
`

export const FilterTitle = styled.h2`
  margin-left: 20px;
`

export default Sidebar