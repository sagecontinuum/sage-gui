import React from 'react'
import styled from 'styled-components'
import {startCase} from 'lodash'

type Props = {
  title?: string
  rows: {id: string, label?: string, format?: React.FC}[]
  data: object[]
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
  thead tr {
    border-top: 1px solid #b8b8b8;
    border-bottom: 1px solid #b8b8b8 !important;
    background: #e2e2e2
  }
`

/* see global style.scss for rest of class styling */