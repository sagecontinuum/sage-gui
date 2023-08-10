import BeeIcon from '/assets/bee.svg'
import styled from 'styled-components'


export default function NotFound() {


  return (
    <Root className="flex align-center column">
      <div className="bee">
        <BeeIcon />
      </div>
      <h1>
        Page Not Found
      </h1>
    </Root>
  )
}

const Root = styled.div`
  margin-top: 2em;
  font-size: 2rem;
  text-align: center;
  color: #666;

  .bee svg {
    max-width: 300px;
  }
`

