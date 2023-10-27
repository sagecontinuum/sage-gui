import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'

import DownloadIcon from '@mui/icons-material/FileDownloadRounded'
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined'
import ErrorMsg from '/apps/sage/ErrorMsg'
import { useProgress } from '/components/progress/ProgressProvider'

import Breadcrumbs from '/apps/sage/data-commons/BreadCrumbs'
import { FileFormatDot } from '/apps/sage/data-commons/FileFormatDot'
import { Card, CardViewStyle } from '/components/layout/Layout'

import * as BK from '/components/apis/beekeeper'
import { marked } from 'marked'

import config from '/config'
const { sensorDictionary } = config



const columns = [{
  id: 'name',
  label: 'Name',
  format: (val, obj) =>
    <a href={obj.url} className="flex items-center" download>
      <DownloadIcon className="download-icon"/>{val}
    </a>
}, {
  id: 'description',
  label: 'Description',
}, {
  id: 'created',
  label: 'Created',
  format: (val) => new Date(val).toLocaleString()
}, {
  id: 'format',
  label: 'Format',
  format: (val) => <FileFormatDot format={val} />
}]


export default function Sensor() {
  const {name} = useParams()

  const {loading, setLoading} = useProgress()

  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)

    BK.getSensor(name)
      .then(data => {
        setData(data)
      })
      .catch(error => setError(error))
      .finally(() => setLoading(false))
  }, [name, setLoading])


  const {hardware, hw_model, description, datasheet} = data || {}

  return (
    <Root>
      <CardViewStyle />

      <Main>
        <Details className="flex column gap">
          <Card>
            <Breadcrumbs path={`/sensors/${name}`} />
          </Card>

          <Card>
            {description &&
              <div dangerouslySetInnerHTML={{__html: marked(description)}}></div>
            }

            {!loading && !description &&
              <span className="muted">no description provided</span>
            }

            {error &&
              <ErrorMsg>{error.message}</ErrorMsg>
            }
          </Card>

          {datasheet &&
            <Card>
              <div className="flex items-end justify-between">
                <h2 className="flex items-center"><DescriptionIcon/>Datasheet</h2>
              </div>
              <a href={datasheet} target="_blank" rel="noreferrer">{datasheet}</a>
            </Card>
          }
        </Details>
      </Main>
    </Root>
  )
}

const Root = styled.div`
  display: flex;
  flex-direction: column;

  .download-icon {
    color: #666;
  }
`

const Main = styled.div`
  padding: 20px;
  width: 100%;
  display: flex;
`

const Details = styled.div`
  width: 100%;
  margin-bottom: 50px;
`
