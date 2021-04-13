import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

import Drawer from '@material-ui/core/Drawer'
import TextField from '@material-ui/core/TextField'
import CircularProgress from '@material-ui/core/CircularProgress'

import * as BK from '../../apis/beekeeper'

type Props = {
  node: string
  columns: {id: string, label: string}[]
  onClose: () => void
}

export default function DetailsSidebar(props: Props) {
  const {node, columns, onClose} = props

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)

  useEffect(() => {
    setLoading(true)
    BK.fetchNode(node)
      .then((data) => setData(data))
      .finally(() => setLoading(false))
  }, [node])


  return (
    <Drawer
      anchor="right"
      open={true}
      onClose={onClose}
      BackdropProps={{ invisible: true }}
      className="ignore-click-outside"
    >
      {loading && <CircularProgress />}
      {data &&
        <Details>
          <h3>{data.name}</h3>

          <table className="key-value-table">
            <tbody>
              <tr>
                <td>Status</td>
                <td className={data.status == 'active' ? 'success' : ''}>
                  <b>{data.status}</b>
                </td>
              </tr>

              {columns
                .filter(o => !['status', 'contact', 'notes'].includes(o.id))
                .filter(o => typeof data[o.id] != 'object')
                .map(o => {
                  return <tr key={o.id}><td>{o.label || o.id}</td><td>{data[o.id]}</td></tr>
                })
              }

              {data.contact &&
                <>
                  <tr><td colSpan={2}>Contact</td></tr>
                  <tr>
                    <td colSpan={2} style={{fontWeight: 400, paddingLeft: '30px'}}>{data.contact}</td>
                  </tr>
                </>
              }
            </tbody>
          </table>

          <br/><br/>

          <TextField
            id={`sage-${data.name}-notes`}
            label="Notes"
            multiline
            rows={4}
            defaultValue={data.notes}
            variant="outlined"
            fullWidth
          />
        </Details>
      }
    </Drawer>
  )
}

const Details = styled.div`
  margin-top: 70px;
  max-width: 385px;
  padding: 0 20px;
`

