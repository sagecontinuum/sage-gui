import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'

import { Button, Chip } from '@mui/material'
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined'
import EditIcon from '@mui/icons-material/EditRounded'
import CancelIcon from '@mui/icons-material/UndoRounded'

import ErrorMsg from '/apps/sage/ErrorMsg'
import { useProgress } from '/components/progress/ProgressProvider'
import { Sidebar, Card, CardViewStyle } from '/components/layout/Layout'
import SimpleForm from '/components/input/SimpleForm'
import Breadcrumbs from '/apps/sage/data-commons/BreadCrumbs'
import { columns } from './SensorList'

import * as BK from '/components/apis/beekeeper'
import { marked } from 'marked'
import useIsSuper from '/components/hooks/useIsSuper'


const fields = [
  {key: 'hardware', label: 'Hardware'},
  {key: 'hw_model', label: 'Model', 
    helpText: 'The model number of your sensor, without the manufacturer name.'}, 
  {key: 'hw_version', label: 'Version'},
  {key: 'sw_version', label: 'Software Version'},
  {key: 'description', label: 'Description', type: 'textarea'},
  {key: 'datasheet', label: 'Datasheet Link'},
  // {key: 'capabilities', label: 'Capabilities'} // todo(nc)
]


export default function Sensor() {
  const {name} = useParams()

  const {loading, setLoading} = useProgress()
  const {isSuper} = useIsSuper()

  const [data, setData] = useState<BK.SensorListRow>(null)
  const [error, setError] = useState(null)

  // form
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [state, setState] = useState<BK.SensorHardware>()

  const getData = useCallback(() => {
    BK.getSensor(name)
      .then(data => {
        setData(data)
        setState(data)
      })
      .catch(error => setError(error))
      .finally(() => setLoading(false))
  }, [name, setLoading])

  useEffect(() => {
    setLoading(true)
    getData()
  }, [setLoading, getData])

  const handleChange = (evt) => {
    const {name, value} = evt.target
    setState(prev => ({...prev, [name]: value}))
  }

  const handleCancel = () => {
    setIsEditing(false)
    setState(data)
  }

  const handleSave = () => {
    setIsSaving(true)
    BK.saveSensor(state)
      .then(() => {
        setIsEditing(false)
        getData()
      })
      .catch(err => setError(err))
      .finally(() => setIsSaving(false))
  }

  const {description, datasheet, capabilities, manufacturer, hw_model} = data || {}

  const formData = {
    fields, data, state, isEditing
  }

  return (
    <Root className="flex">
      <CardViewStyle />

      {!isEditing &&
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
                {columns.find(o => o.id == 'nodeCount').format(null, data)}
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
      } 

      <Main className="flex gap">
        <Details className="flex column gap">
          <Card className="flex items-center justify-between">
            <Breadcrumbs path={`/sensors/${name}`} />

            {isSuper && 
              <>
                {isEditing ?
                  <Button
                    variant="outlined"
                    className="cancel"
                    onClick={handleCancel}
                    startIcon={<CancelIcon/>}
                  >
                    Cancel
                  </Button> :
                  <Button startIcon={<EditIcon/>} onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                }
              </>
            }
          </Card>

          {isEditing && formData &&
            <Card>
              <SimpleForm {...formData} onChange={handleChange} />
              {isEditing &&
                <Button
                  className="save"
                  variant="contained"
                  type="submit"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              }              
            </Card>
          }

          {!isEditing &&
            <>
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
            </>
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

  .save {
    margin-top: 2rem;
  }
`

const Details = styled.div`
  width: 100%;
  margin-bottom: 50px;
`
