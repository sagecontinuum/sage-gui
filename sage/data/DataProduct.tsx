import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'

import Chip from '@material-ui/core/Chip'
import Alert from '@material-ui/lab/Alert'
import Button from '@material-ui/core/Button'
import DownloadIcon from '@material-ui/icons/CloudDownloadOutlined'

import { useProgress } from '../../components/progress/ProgressProvider'
import ErrorMsg from '../ErrorMsg'

import Breadcrumbs from './BreadCrumbs'
import { formatter } from './DataSearch'
import {Top} from '../common/Layout'

import * as Data from '../apis/data'
import * as BH from '../../admin-ui/apis/beehive'

import Table from '../../components/table/Table'

function getDownloadURL(id) {
  return `${Data.downloadUrl}/${id}?bom=True`
}


function formatNotes(text: string) : string {
  return text.replace(/\n/g, '<br>').replace(/\*/g, '•')
}



const columns = [
  {
    id: 'timestamp',
    label: 'Time',
  },   {
    id: 'name',
    label: 'Name',
  }, {
    id: 'value',
    label: 'Value',
  }, {
    id: 'meta',
    label: 'Meta',
    format: (o) =>
      Object.keys(o).map(k => {
        return <div key={k}><b>{k}</b>: {o[k]}</div>
      })
  },
]



export default function Product() {
  const {name} = useParams()

  const {setLoading} = useProgress()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const [isPlugin, setIsPlugin] = useState(false)
  const [pluginData, setPluginData] = useState(null)

  useEffect(() => {
    setLoading(true)

    Data.getPackage(name)
      .then(data => {

        const {result} = data
        setData(result)

        const isPlugin = result.extras.filter(o => o.key == 'ecr_plugin_url').length > 0

        setIsPlugin(isPlugin)
      })
      .catch(error => setError(error))
      .finally(() => setLoading(false))
  }, [name, setLoading])

  useEffect(() => {
    BH.getData({
      start: '-1d',
      filter: {
        name: 'iio.*',
      },
      tail: 1
    }).then((data) => setPluginData(data))
      .catch(error => setError(error))
  }, [isPlugin])


  return (
    <Root>
      <Alert severity="info" style={{borderBottom: '1px solid #f2f2f2' }}>
        The data explorer is currently under development and available here for <b>early preview</b>.
        Pease check back later when more data is available.
      </Alert>
      <Main>

        <Sidebar>
          <a type="submit" href="https://web.lcrc.anl.gov/public/waggle/sagedata/measurements/sys.boot_time/2021-04-21.csv.gz">Download!</a>

          <h2>About</h2>

          <h4>Organization</h4>
          {data && data.organization.title}

          <h4>Keywords</h4>
          <Keywords>
            {data && data.tags.map(tag =>
              <Chip key={tag.name} label={tag.display_name} variant="outlined" size="small"/>
            )}
          </Keywords>

          <h4>Last Updated</h4>
          <div>Updated {data && formatter.time(data.metadata_modified+'Z')}</div>

          <h4>Created</h4>
          <div>{data?.metadata_modified+'Z'}</div>

          <h4>Resource Type</h4>
          <div>{data && formatter.resources(data.resources)}</div>

          <h4>License</h4>
          <div>{data?.license_title || 'N/A'}</div>
        </Sidebar>

        <Details>
          <Top>
            <Breadcrumbs path={`/data/${name}`} />
          </Top>

          <div className="flex items-center justify-between">
            <h1>{name}</h1>

            {data &&
              <Button
                href={getDownloadURL(data.resources[0].id)}
                startIcon={<DownloadIcon/>}
                variant="contained"
                color="primary"
              >
                Download
              </Button>
            }
          </div>

          {data &&
            <span dangerouslySetInnerHTML={{__html: formatNotes(data.notes)}}></span>
          }

          {error &&
            <ErrorMsg>{error}</ErrorMsg>
          }

          <PreviewTable>
            <h3>Preview of Most Recent Data</h3>
            {isPlugin && pluginData &&
              <Table
                primaryKey="id"
                enableSorting
                columns={columns}
                rows={pluginData}
              />
            }
          </PreviewTable>
        </Details>
      </Main>
    </Root>
  )
}

const Root = styled.div`
  display: flex;
  flex-direction: column;
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
`

const PreviewTable = styled.div`
  margin-top: 5em;
`