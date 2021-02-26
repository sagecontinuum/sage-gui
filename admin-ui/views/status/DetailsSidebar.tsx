import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

import Drawer from '@material-ui/core/Drawer'
import TextField from '@material-ui/core/TextField'

type Props = {
  selected: any[]
  columns: any[]
  onClose: () => void
}

export default function DetailsSidebar(props: Props) {
  const {selected, columns, onClose} = props

  const [item, setItem] = useState(selected ? selected[0] : null)

  useEffect(() => {
    if (!selected) return
    setItem(selected[0])
  }, [selected])


  return (
    <Drawer
      anchor="right"
      open={true}
      onClose={onClose}
      BackdropProps={{ invisible: true }}
      className="ignore-click-outside"
    >
      <Details>
        <h3>{item.name}</h3>

        <table className="key-value-table">
          <tbody>
            <tr>
              <td>Status</td>
              <td className={item.status == 'active' ? 'success' : ''}>
                <b>{item.status}</b>
              </td>
            </tr>

            {columns
              .filter(o => !['status', 'contact', 'notes'].includes(o.id))
              .map(o =>
                <tr key={o.id}><td>{o.label || o.id}</td><td>{item[o.id]}</td></tr>
              )
            }

            <tr><td colSpan={2}>Contact</td></tr>
            <tr>
              <td colSpan={2} style={{fontWeight: 400, paddingLeft: '30px'}}>{item.contact}</td>
            </tr>
          </tbody>
        </table>

        <br/><br/>

        <TextField
          id={`sage-${item.name}-notes`}
          label="Notes"
          multiline
          rows={4}
          defaultValue={item.notes}
          variant="outlined"
          fullWidth
        />
      </Details>
    </Drawer>
  )
}

const Details = styled.div`
  margin-top: 70px;
  max-width: 385px;
  padding: 0 20px;
`

