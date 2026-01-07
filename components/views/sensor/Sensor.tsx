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
import SimpleForm, { type Field } from '/components/input/SimpleForm'
import Breadcrumbs from '/apps/sage/data-commons/BreadCrumbs'
import { columns } from './SensorList'

import * as BK from '/components/apis/beekeeper'
import { marked } from 'marked'
import { useIsSuper } from '/components/auth/PermissionProvider'

import { flatten, uniq } from 'lodash'


const fieldSpec: Field[] = [
  {id: 'hardware', label: 'Hardware'},
  {id: 'hw_model', label: 'Model',
    helpText: 'The model number of your sensor, without the manufacturer name.'},
  /* hide capabilities until updates are supported
    {id: 'capabilities', label: 'Capabilities',  multiple: true,
      helpText: 'Search or type a new capability', placeholder: 'Search...'}, */
  {id: 'hw_version', label: 'Hardware Version'},
  {id: 'sw_version', label: 'Software Version'},
  {id: 'description', label: 'Description', type: 'textarea'},
  {id: 'datasheet', label: 'Datasheet Link', width: '800px'}
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
  const [fields, setFields] = useState<Field[]>(fieldSpec)

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

  // fetch capability options if editing
  useEffect(() => {
    if (!isEditing) return

    // fetch and add options to field spec (for the "capabilities" dropdown)
    setLoading(true)
    BK.getAllSensors()
      .then((sensors) => {
        const capabilityLists = sensors.map(o => o.capabilities)
        const flatList = flatten(capabilityLists)
        const options = uniq(flatList)

        const i = fields.findIndex(o => o.id == 'capabilities')
        if (i < 0)
          return

        fields.splice(i, 1, {...fields[i], options})
        setFields(fields)
      })
      .finally(() => setLoading(false))
  }, [isEditing, setLoading])

  const handleChange = (name, value) => {
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
      {CardViewStyle}

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
          <Card className="flex items-center gap">
            <Breadcrumbs path={`/sensors/${name}`} />

            {isSuper && !isEditing &&
              <Button startIcon={<EditIcon/>} onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            }
            {isEditing &&
              <Button
                variant="outlined"
                className="cancel"
                onClick={handleCancel}
                startIcon={<CancelIcon/>}
              >
                Cancel
              </Button>
            }
          </Card>

          {isEditing && formData &&
            <Card>
              <SimpleForm {...formData} onChange={handleChange} />
              {isEditing &&
                <div className="flex items-center gap action-btns">
                  <Button
                    variant="contained"
                    type="submit"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    variant="outlined"
                    className="cancel"
                    onClick={handleCancel}
                    startIcon={<CancelIcon/>}
                  >
                    Cancel
                  </Button>
                </div>
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

        {error &&
          <ErrorMsg>{error.message}</ErrorMsg>
        }
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

  .action-btns {
    margin-top: 2rem;
  }
`

const Details = styled.div`
  width: 100%;
  margin-bottom: 50px;
`
