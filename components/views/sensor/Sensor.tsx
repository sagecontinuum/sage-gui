import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'

import Chip from '@mui/material/Chip'
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined'
import ErrorMsg from '/apps/sage/ErrorMsg'
import { useProgress } from '/components/progress/ProgressProvider'
import { Sidebar, Card, CardViewStyle } from '/components/layout/Layout'

import Breadcrumbs from '/apps/sage/data-commons/BreadCrumbs'
import { columns } from './SensorList'

import * as BK from '/components/apis/beekeeper'
import { marked } from 'marked'



export default function Sensor() {
  const {name} = useParams()

  const {loading, setLoading} = useProgress()

  const [data, setData] = useState<BK.SensorTableRow>(null)
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

  const {description, datasheet, capabilities, manufacturer, hw_model, nodeCount} = data || {}

  return (
    <Root className="flex">
      <CardViewStyle />

      <Sidebar width="250px" style={{padding: '20px'}}>
        {data &&
          <ul className="list-none no-padding">
            <li>
              <h4>Manufacturer</h4>
              {manufacturer}
            </li>
            <li>
              <h4>Model</h4>
              {hw_model}
            </li>
            <li>
              <h4>Nodes with Sensor</h4>
              {columns.find(o => o.id == 'nodeCount').format(nodeCount, data)}
            </li>
            {capabilities?.length > 0 &&
              <li>
                <h4>Capabilities</h4>
                <Capabilities>
                  {capabilities.map(capability =>
                    <Chip key={capability} label={capability} />
                  )}
                </Capabilities>
              </li>
            }
          </ul>
        }
      </Sidebar>

      <Main className="flex gap">
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
`

const Capabilities = styled.div`
  div {
    margin: 2px;
  }
`

const Main = styled.div`
  padding: 20px;
  width: 100%;
`

const Details = styled.div`
  width: 100%;
  margin-bottom: 50px;
`
