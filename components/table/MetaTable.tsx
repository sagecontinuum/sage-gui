import styled from 'styled-components'
import {startCase} from 'lodash'

type Props = {
  rows: {
    id: string,
    label?: string | JSX.Element,
    format?: (val?: any, obj?: object) => JSX.Element
  }[]
  data: object[]
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


const Table = styled.table`
  thead th {
    color: #fff;
    background: #4e2a84;
  }

  tbody td:first-child {
    width: 100px;
    text-align: right;
  }
`

/* see global style.scss for rest of class styling */

