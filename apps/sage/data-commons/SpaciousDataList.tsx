import React from 'react'
import styled from 'styled-components'
import { formatter } from './DataProductSearch'
import { Item, Title } from '/components/layout/Layout'
import { Link } from 'react-router-dom'
import highlightText from '/components/utils/text'


type Props = {
  rows: {[key: string]: any}
}

export default function SpaciousLayout(props: Props) {
  const {rows, ...rest} = props

  return (
    <Root>
      <Rows>
        {rows.map((row) =>
          <Row key={row.id} data={row} {...rest} />
        )}
      </Rows>
    </Root>
  )
}

const Root = styled.div`
  margin-top: 5px;
`


const Rows = styled.div`
  margin-top: 1em;
`



function Row(props) {
  const {data, query} = props
  const {
    title,
    name,
    notes,
    tags,
    metadata_modified,
    resources,
    license_title
  } = data


  return (
    <Item className="flex column" to={`data/product/${name}`}>
      <Title>{formatter.title(title, data)}</Title>

      {notes &&
        <Notes>
          {highlightText(notes.slice(0, 250), query ? query : '')}
          {notes.length > 250 ? <>... <Link to={`data/product/${name}`}>read more</Link></> : ''}
        </Notes>
      }

      <div className="flex items-center">
        {notes &&
          <Keywords>{formatter.tags(tags)}</Keywords>
        }
      </div>

      <div className="flex items-center gap muted">
        <Type className="flex">{formatter.resources(resources)}</Type>
        <div>Updated {formatter.time(metadata_modified+'Z')}</div>
        <div>{license_title}</div>
      </div>
    </Item>
  )
}


const Notes = styled.p`
  margin-bottom: 0px;
`

const Keywords = styled.p`
  div {
    margin: 2px 3px 2px 0;
  }
`

const Type = styled.div`
  div {
    margin: 2px 3px 2px 0;
  }
`
