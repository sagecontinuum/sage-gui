import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useParams } from 'react-router-dom'

import TextField from '@material-ui/core/TextField'
import Alert from '@material-ui/lab/Alert'

import * as BK from '../../apis/beekeeper'
import { useProgress } from '../../../components/progress/ProgressProvider'

export default function NodeView() {
  const {node} = useParams()

  const { setLoading } = useProgress()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    BK.fetchNode(node)
      .then(data => setData(data))
      .catch(error => setError(error))
      .finally(() => setLoading(false))
  }, [node, setLoading])

  if (!data && !error) return <></>

  return (
    <Root>
      <h2>{node}</h2>

      <table className="key-value-table">
        <tbody>
          <tr>
            <td>Status</td>
            <td className={data.status == 'active' ? 'success' : ''}>
              <b>{data.status}</b>
            </td>
          </tr>

          {Object.entries(data)
            .map(([key, val]) => {
              const label = key.replace(/_/g, ' ')
                .replace(/\b[a-z](?=[a-z]{1})/g, c => c.toUpperCase())
              return <tr key={key}><td>{label}</td><td>{val || '-'}</td></tr>
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
        style={{width: '50%'}}
      />

      {error &&
        <Alert severity="error">{error.message}</Alert>
      }
    </Root>
  )
}


const Root = styled.div`
  margin: 20px;
`