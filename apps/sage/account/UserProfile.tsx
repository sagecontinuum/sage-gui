import { useState, useEffect, useMemo } from 'react'
import styled from 'styled-components'

import {
  Button, Alert, FormHelperText,
  FormControl, useFormControl, OutlinedInput
} from '@mui/material'
import EditIcon from '@mui/icons-material/EditRounded'
import CancelIcon from '@mui/icons-material/UndoRounded'

import { useProgress } from '/components/progress/ProgressProvider'
import * as User from '/components/apis/user'




const fields = [
  {key: 'sage_username', label: 'Username', edit: false},
  {key: 'organization', label: 'Organization', maxLength: 30},
  {key: 'department', label: 'Department', maxLength: 30},
  {key: 'bio', label: 'Biography', type: 'textarea', maxLength: 500}
]


export default function UserProfile() {
  const {setLoading} = useProgress()
  const [data, setData] = useState<User.Info>()
  const [error, setError] = useState()

  // form
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [state, setState] = useState<User.Info>()


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
            const {key, label, edit, type, maxLength} = obj
            const value = data[key]

            return (
              <div key={key}>
                <h2>{label}</h2>
                {isEditing && edit != false ?
                  <FormControl>
                    <OutlinedInput
                      placeholder={`My ${label}`}
                      aria-label={label}
                      name={key}
                      onChange={handleChange}
                      value={state[key]}
                      multiline={type == 'textarea'}
                      minRows={type == 'textarea' ? 4 : 0}
                      style={type == 'textarea' ? {width: 500} : {width: 300}}
                      inputProps={{maxLength}}
                    />
                    <FocusedHelperText
                      text={state[key]?.length > 20 &&
                        `${maxLength - state[key]?.length} characters left`}
                    />
                  </FormControl> :
                  <p>{value ? value : <i className="muted">Not available</i>}</p>
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
            disabled={isSaving}
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
  margin: 50px 100px;
  width: 500px;

  .user-info {
    margin: 2em 0;
  }

  .delete {
    border-color: #660000;
  }
`


function FocusedHelperText({text}) {
  const { focused } = useFormControl()

  const helperText = useMemo(() => {
    return focused ? text : ''
  }, [focused, text])

  return <FormHelperText>{helperText}</FormHelperText>
}

