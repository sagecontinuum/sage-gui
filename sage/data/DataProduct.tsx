import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'

import Chip from '@material-ui/core/Chip'

import { useProgress } from '../../components/progress/ProgressProvider'
import ErrorMsg from '../ErrorMsg'

import Breadcrumbs from './BreadCrumbs'

import config from '../../config'
import Alert from '@material-ui/lab/Alert'
const url = config.sageCommons

function formatNotes(text: string) {
  return text.replace(/\n/g, '<br>').replace(/\*/g, '•')
}

type Props = {

}

export default function Product(props: Props) {
  const {name} = useParams()

  const {setLoading} = useProgress()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)

    const req = `${url}/action/package_show?id=${name}`
    fetch(req)
      .then(res => res.json())
      .then(data => setData(data.result))
      .catch(error => setError(error))
      .finally(() => setLoading(false))
  }, [name, setLoading])

  return (
    <Root>
      <Alert severity="info" style={{borderBottom: '1px solid #f2f2f2' }}>
        The data explorer is currently under development and available here for <b>early preview</b>.
        Pease check back later when more data is available.
      </Alert>
      <Main>
        <Aside>
          <h2>About</h2>

          <h4>Organization</h4>
          {data && data.organization.title}

          <h4>Keywords</h4>
          <Keywords>
            {data && data.tags.map(tag =>
              <Chip key={tag.name} label={tag.display_name} variant="outlined" size="small"/>
            )}
          </Keywords>
        </Aside>

        <Details>
          <Breadcrumbs path={`/data/${name}`} />

          <h1>{name}</h1>
          {data &&
            <span dangerouslySetInnerHTML={{__html: formatNotes(data.notes)}}></span>
          }
        </Details>

        {error &&
          <ErrorMsg>{error}</ErrorMsg>
        }
      </Main>
    </Root>
  )
}

const Root = styled.div`
  display: flex;
  flex-direction: column;
`

const Aside = styled.aside`
  height: calc(100vh - 60px);

  width: 300px;
`

const Main = styled.div`
  padding: 20px;
  width: 100%;
  display: flex;
`

const Keywords = styled.div`
  div {
    margin: 2px;
  }
`

const Details = styled.div`
  width: 100%;
`