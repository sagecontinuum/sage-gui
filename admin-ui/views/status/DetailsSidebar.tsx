import React from 'react'
import styled from 'styled-components'

import Drawer from '@material-ui/core/Drawer'
import TextField from '@material-ui/core/TextField'

type Props = {
  selected: object
  columns: any[]
  onClose: () => void
}

export default function DetailsSidebar(props: Props) {
  const {selected, columns, onClose} = props

  const name = selected['Node CNAME']

  return (
    <Root>

      <Drawer anchor="right" open={true} onClose={onClose}>
        <Details>
          <h3>{name}</h3>

          <table className="key-value-table">
            <tbody>
              <tr>
                <td>Status</td>
                <td className={selected['status'] == 'active' ? 'success' : ''}>
                  <b>{selected['status']}</b>
                </td>
              </tr>

              {columns
                .filter(o => !['status', 'Contact', 'Notes'].includes(o.id))
                .map(o =>
                  <tr><td>{o.label || o.id}</td><td>{selected[o.id]}</td></tr>
              )}

              <tr><td colSpan={2}>Contact</td></tr>
              <tr>
                <td colSpan={2} style={{fontWeight: 400, paddingLeft: '30px'}}>{selected['Contact']}</td>
              </tr>
            </tbody>
          </table>
          <br/><br/>
          <TextField
            id={`sage-${name}-notes`}
            label="Notes"
            multiline
            rows={4}
            defaultValue={selected['Notes']}
            variant="outlined"
            fullWidth
          />
        </Details>
      </Drawer>

    </Root>
  )
}

const Root = styled.div`

`


const Details = styled.div`
  margin-top: 70px;
  max-width: 385px;
  padding: 0 20px;
`

