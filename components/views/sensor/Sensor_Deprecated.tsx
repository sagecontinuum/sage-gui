import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'

import Chip from '@mui/material/Chip'
import DownloadIcon from '@mui/icons-material/FileDownloadRounded'
import ErrorMsg from '/apps/sage/ErrorMsg'
import { useProgress } from '/components/progress/ProgressProvider'

import Breadcrumbs from '/apps/sage/data-commons/BreadCrumbs'
import { formatter } from '/apps/sage/data-commons/DataProductSearch'
import { FileFormatDot } from '/apps/sage/data-commons/FileFormatDot'
import { Card, CardViewStyle } from '/components/layout/Layout'

import * as Data from '/components/apis/dataCommons'
import Table from '/components/table/Table'



function formatNotes(text: string) : string {
  text.replace(/http/g, '<br>').replace(/\*/g, '•')
  return text.replace(/\n/g, '<br>').replace(/\*/g, '•')
}


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

  const {setLoading} = useProgress()

  const [data, setData] = useState(null)
  const [error, setError] = useState(null)


  useEffect(() => {
    setLoading(true)

    Data.getPackage(name.toLowerCase())
      .then(({result}) => {
        setData(result)
      })
      .catch(error => setError(error))
      .finally(() => setLoading(false))
  }, [name, setLoading])

  return (
    <Root>
      <CardViewStyle />

      <Main>
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


        <Details className="flex column gap">
          <Card>
            <Breadcrumbs path={`/sensors/${name}`} />
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h1>{data?.title}</h1>
            </div>

            {data &&
              <span dangerouslySetInnerHTML={{__html: formatNotes(data.notes)}}></span>
            }

            {error &&
              <ErrorMsg>{error.message}</ErrorMsg>
            }
          </Card>

          <Card>
            <div className="flex items-end justify-between">
              <h2>Downloads</h2>
            </div>
            {data &&
              <Table
                primaryKey="name"
                enableSorting
                columns={columns}
                rows={data.resources}
              />
            }
          </Card>
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
  margin-bottom: 50px;
`
