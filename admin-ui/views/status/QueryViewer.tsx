import React from 'react'
import styled from 'styled-components'



type Props = {
 filterState: {[filed: string]: string[]}
}

export default function QueryViewer(props: Props) {
  const {filterState} = props

  const fields =
    Object.keys(filterState)
      .filter(field => filterState[field].length)

  return (
    <Root>
      {fields
        .map((field, i) => {
          const filters = filterState[field]

          return (
            <span key={field}>
              <FilterSet>
                <b>{field}</b>
                <span> is </span>
                <Badge>{filters.join(', ')}</Badge>
              </FilterSet>
              {i !== fields.length - 1  && <span> and </span>}
            </span>
          )
        })
      }
    </Root>
  )
}

const Root = styled.div`
  margin: 0 10px;
`

const FilterSet = styled.span`
`

const Badge = styled.span`
  padding: 2px 5px;
  font-weight: 800;
  color: #fff;
  border-radius: 5px;
  background-color: #1a8cc9;
`
