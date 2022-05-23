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
  thead th {
    color: #fff;
    border-radius: 5px 5px 0 0;
    border-bottom: 2px solid #888 !important;
    background: #999;
  }
`

/* see global style.scss for rest of class styling */