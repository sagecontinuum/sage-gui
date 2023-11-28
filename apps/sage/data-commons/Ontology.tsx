
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'

import Alert from '@mui/material/Alert'
import * as BK from '/components/apis/beekeeper'
import { useProgress } from '/components/progress/ProgressProvider'
import { Card, CardViewStyle } from '/components/layout/Layout'


export default function Ontology() {
  const {name} = useParams()

  const [data, setData] = useState<BK.OntologyObj>()
  const [error, setError] = useState(null)
  const {setLoading} = useProgress()

  useEffect(() => {
    setLoading(true)
    BK.getOntology(name)
      .then(data => {
        if (!data) {
          setError('not found')
          return
        }

        setData(data)
      })
      .catch(err => setError(err))
      .finally(() => setLoading(false))
  }, [name])


  return (
    <Root>
      <CardViewStyle />

      <Card>
        <h1 className="no-margin">Ontology</h1>

        <h2>{name}</h2>

        {data &&
          <table className="simple key-value">
            <thead></thead>
            <tbody>
              <tr><td>Name</td><td>{data.ontology}</td></tr>
              <tr><td>Description</td><td>{data.description}</td></tr>
              <tr><td>Units</td><td>{data.units}</td></tr>
              <tr><td>Type</td><td>{data.unit}</td></tr>
              <tr><td>Source</td><td><a href={data.source}>{data.source}</a></td></tr>
            </tbody>
          </table>
        }

        {error == 'not found' &&
          <Alert severity="info">There is no record for <b>{name}</b></Alert>
        }

        {error && error !== 'not found' &&
          <Alert severity="error">{error.message}</Alert>
        }
      </Card>
    </Root>
  )
}

const Root = styled.div`
  margin: 2em;
`
