import { Link } from 'react-router-dom'
import styled from 'styled-components'

export const Item = styled.div`
  position: relative;
  margin: 20px 1px; // 1px left/right for sticky header
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-shadow: 0px 0px 1px 1px #f8f8f8;
  color: initial;

  :hover {
    text-decoration: none;
    border: 1px solid rgb(28, 140, 201);
  }

  .actions {
    position: absolute;
    display: none;
    background: #fff; // overlay on text if needed
    bottom: .5rem;
    right: .6rem;
  }

  :hover .actions {
    display: block;
  }
`

export const Title = styled.div`
  font-size: 1.5em;
  font-weight: 800;
`

export const Top = styled.div<{top: string}>`
  position: sticky;
  top: ${props => props.top || '60px'};
  z-index: 100;
`


const Shadow = styled.div`
  position: sticky;
  width: 100%;
  box-shadow: -2px 1px 5px 2px rgb(175 175 175 / 75%);
  z-index: 0;
`

const ShadowCover = styled.div`
  position: absolute;
  background: #fff;
  width: 100%;
  height: 10px;
`
