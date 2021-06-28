import { Link } from 'react-router-dom'
import styled from 'styled-components'

export const Item = styled(Link)`
  position: relative;
  margin: 20px 0;
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

