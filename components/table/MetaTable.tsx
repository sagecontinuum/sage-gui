import { styled } from '@mui/material'
import {startCase} from 'lodash'

type Props = {
  rows: {
    id: string,
    label?: string | JSX.Element,
    format?: (val?: any, obj?: object) => string | JSX.Element
  }[]
  data: object
  title?: string | JSX.Element
}

export default function MetaTable(props:Props) {
  const {title, rows, data} = props

  return (
    <Table className="simple key-value">
      {title &&
        <thead>
          <tr><th colSpan={2}>{title}</th></tr>
        </thead>
      }
      <tbody>
        {rows.map((item) => {
          const {id, label, format} = item
          return (
            <tr key={id}>
              <td>{label || startCase(id.replace(/_/g, ' '))}</td>
              <td>{
                format ?
                  format(data[id], data) :
                  ((data[id] || '-').toString() || '-')
              }
              </td>
            </tr>
          )
        })}
      </tbody>
    </Table>
  )
}


const Table = styled('table')`
  thead th {
    color: ${props => props.theme.palette.primary.contrastText};
    background: #4e2a84;
  }

  tbody td:first-child {
    width: 100px;
    text-align: right;
  }

  tr:not(:first-child) {
    border-top: 1px solid ${props => props.theme.palette.divider};
  }
  thead tr {
    border-top: 1px solid ${props => props.theme.palette.divider};
  }
`

/* see global style.scss for rest of class styling */

