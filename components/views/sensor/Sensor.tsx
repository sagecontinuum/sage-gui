import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'

import DescriptionIcon from '@mui/icons-material/DescriptionOutlined'
import ErrorMsg from '/apps/sage/ErrorMsg'
import { useProgress } from '/components/progress/ProgressProvider'

import Breadcrumbs from '/apps/sage/data-commons/BreadCrumbs'

import { Card, CardViewStyle } from '/components/layout/Layout'

import * as BK from '/components/apis/beekeeper'
import { marked } from 'marked'


/* table version of related data (if needed)
import DownloadIcon from '@mui/icons-material/FileDownloadRounded'
import { FileFormatDot } from '/apps/sage/data-commons/FileFormatDot'

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
*/


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


  const {description, datasheet} = data || {}

  return (
    <Root>
      <CardViewStyle />

      <Sidebar>
        <h2>About</h2>

        <h4>Organization</h4>
        {data && data.organization.title}

        <h4>Keywords</h4>
        <Keywords>
          {data && data.tags.map(tag =>
            <Chip key={tag.name} label={tag.display_name} />
          )}
        </Keywords>

        <h4>Last Updated</h4>
        <div>{new Date(data?.metadata_modified).toLocaleString()}</div>

        <h4>Created</h4>
        <div>{new Date(data?.metadata_modified).toLocaleString()}</div>

        <h4>Resource Type</h4>
        <div>{data && formatter.resources(data.resources)}</div>

        <h4>License</h4>
        <div>{data?.license_title || 'N/A'}</div>
      </Sidebar>

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

const Sidebar = styled.div`
  position: sticky;
  top: 0;
  height: calc(100vh - 60px);
  width: 300px;
  padding: 0 10px;
`
const Keywords = styled.div`
  div {
    margin: 2px;
  }
`

const Details = styled.div`
  width: 100%;
  margin-bottom: 50px;
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
