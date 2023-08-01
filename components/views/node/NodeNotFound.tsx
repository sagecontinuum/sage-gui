import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

import BeeIcon from 'url:/assets/bee.svg'
import styled from 'styled-components'

import { Alert } from '@mui/material'

import * as BK from '/components/apis/beekeeper'


export default function NodeNotFound() {
  const vsn = useParams().vsn as BK.VSN

  const [recommended, setRecommended] = useState()
  const [error, setError] = useState(null)

  useEffect(() => {
    BK.getNodeMeta({by: 'id'})
      .then(data => setRecommended(vsn in data ? data[vsn].vsn : null))
      .catch(err => setError(err))
  }, [vsn])

  return (
    <Root className="flex align-center column">
      {error &&
        <Alert severity="error">{error.message}</Alert>
      }
      <div>
        <img src={BeeIcon} />
      </div>
      <p>
        The VSN <b>{vsn}</b> can not be found.
      </p>
      {recommended &&
        <div>Were you looking for <a href={`/node/${recommended}`}>{recommended}</a>?</div>
      }
    </Root>
  )
}

const Root = styled.div`
  margin-top: 2em;
  font-size: 2rem;
  text-align: center;
  color: #666;

  img {
    max-width: 300px;
  }
`

