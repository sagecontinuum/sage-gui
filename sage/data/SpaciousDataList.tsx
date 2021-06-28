import React from 'react'
import styled from 'styled-components'
import { formatter } from './DataSearch'
import { Item, Title } from '../common/SpaciousList'



type Props = {
  rows: {[key: string]: any}
}

export default function SpaciousLayout(props: Props) {
  const {rows, ...rest} = props

  return (
    <Root>
      <HR />
      <Rows>
        {rows.map((row) =>
          <Row key={row.id} data={row} {...rest} />
        )}
      </Rows>
    </Root>
  )
}

const Root = styled.div`
  margin-top: 1em;
`

const HR = styled.div`
  border-top: 1px solid #ddd;
`

const Rows = styled.div`
  margin-top: 1em;
`


function Row(props) {
  const {data} = props
  const {
    title,
    name,
    notes,
    resources
  } = data

  return (
    <Item className="flex column" to={`data/product/${name}`}>
      <div className="flex items-center justify-between">
        <Title>{formatter.title(title, data)}</Title>
        <Type>{formatter.resources(resources)}</Type>
      </div>

      {notes &&
        <p>{notes.slice(0, 250)}</p>
      }

      {notes &&
        <Keywords>{formatter.tags(data.tags)}</Keywords>
      }
    </Item>
  )
}


const Keywords = styled.p`
  div {
    margin: 2px;
  }
`
const Type = styled.div`
  margin-right: 15px;
`
