import { useState, useEffect } from 'react'
import styled from 'styled-components'

import { TextField, Button, Alert } from '@mui/material'
import EditIcon from '@mui/icons-material/EditRounded'
import CancelIcon from '@mui/icons-material/UndoRounded'

import { useProgress } from '/components/progress/ProgressProvider'
import * as User from '/components/apis/user'



const fields = [
  {key: 'sage_username', label: 'Username', edit: false},
  {key: 'organization', label: 'Organization'},
  {key: 'department', label: 'Department'},
  {key: 'bio', label: 'Biography', type: 'textarea'}
]


export default function UserProfile() {
  const {loading, setLoading} = useProgress()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [data, setData] = useState<User.Info>()
  const [state, setState] = useState<User.Info>()
  const [error, setError] = useState()

  useEffect(() => {
    setLoading(true)
    User.getUserInfo()
      .then(data => {
        setData(data)
        setState(data)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [setLoading])


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
    User.saveUserInfo(state)
      .then(data => {
        setIsEditing(false)
        setData(data)
      })
      .catch(err => setError(err))
      .finally(() => setIsSaving(false))
  }


  return (
    <Root>
      <div className="flex align-center gap">
        <h1 className="no-margin">
          My Profile
        </h1>
        {isEditing ?
          <Button
            variant="outlined"
            type="submit"
            className="delete"
            onClick={handleCancel}
            startIcon={<CancelIcon/>}
          >
            Cancel
          </Button> :
          <Button startIcon={<EditIcon/>} onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        }
      </div>

      {data &&
        <div className="flex column user-info">
          {fields.map(obj => {
            const {key, label, edit, type} = obj
            const value = data[key]

            return (
              <div key={key}>
                <h2>{label}</h2>
                {isEditing && edit != false ?
                  <TextField
                    label={`My ${label}`}
                    name={key}
                    onChange={handleChange}
                    value={state[key]}
                    multiline={type == 'textarea'}
                    minRows={type == 'textarea' ? 4 : 0}
                    style={type == 'textarea' ? {width: 500} : {}}
                  /> :
                  <p>{value ? value : <i className="muted">Not specified</i>}</p>
                }
              </div>
            )
          })}
        </div>
      }

      <div className="flex justify-between">
        {isEditing &&
          <Button
            className="save"
            variant="contained"
            type="submit"
            onClick={handleSave}
            disabled={loading}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        }
      </div>

      {error &&
        <Alert severity="error">{error}</Alert>
      }

    </Root>
  )
}

const Root = styled.div`
  margin: 2rem 2rem 5rem 2rem;
  width: 500px;

  .user-info {
    margin: 2em 0;
  }

  .delete {
    border-color: #660000;
  }
`


