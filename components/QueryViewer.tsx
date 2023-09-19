import styled from 'styled-components'

import Chip from '@mui/material/Chip'


type Props = {
  filterState: {[field: string]: string[]}
  disableDelete?: {field: string, filter: string}
  scroll?: boolean
  onDelete?: (field: string, newState: string[]) => void
}

export default function QueryViewer(props: Props) {
  const {filterState, scroll, disableDelete, onDelete} = props

  const handleDelete = (field: string, filters: string[], toRemove: string) => {
    filters.splice(filters.indexOf(toRemove), 1)
    onDelete(field, filters)
  }

  const shouldDisableDelete = (field: string, filter: string) =>
    onDelete && disableDelete?.field == field && disableDelete?.filter == filter

  const fields =
    Object.keys(filterState)
      .filter(field => filterState[field].length)

  return (
    <Root scroll={scroll}>
      {fields
        .map((field, i) => {
          const filters = filterState[field]

          return (
            <span key={field} className="part">
              <FilterSet>
                <b>{field}</b>
                <span> is </span>
                {filters.map((filter, i) =>
                  <span key={filter}>
                    <Chip
                      color="primary"
                      variant="filled"
                      size="small"
                      onDelete={shouldDisableDelete(field, filter) ?
                        null : () => handleDelete(field, filters, filter)
                      }
                      label={filter}
                    />
                    {i !== filters.length - 1 && ' '}
                  </span>
                )}
              </FilterSet>
              {i !== fields.length - 1  && <span> and </span>}
            </span>
          )
        })
      }
    </Root>
  )
}

const Root = styled.div<{scroll: boolean}>`
  margin: 2px 10px;

  ${props => props.scroll ?
    `white-space: nowrap;
    overflow-x: scroll;
    height: 40px;`
    : ''
}`

const FilterSet = styled.span`
`
