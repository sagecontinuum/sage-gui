import styled from 'styled-components'
import { Card, CardViewStyle } from '/components/layout/Layout'


export default function TestDownload() {

  return (
    <Root>
      {CardViewStyle}

      <Card >
        <h2>Object Storage Example (W06C)</h2>
        <img
          src={
            'https://storage.sagecontinuum.org/api/v1/data/imagesampler-top-2687/' +
            'sage-imagesampler-top-0.3.7/000048b02d3ae335/1739206807613290074-sample.jpg'
          } />
      </Card>
    </Root>
  )
}


const Root = styled.div`
  margin: 2rem;
  max-width: 400px;

  img {
    max-width: 350px;
  }
`