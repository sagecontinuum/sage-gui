import { useState } from 'react'
import styled from 'styled-components'
import { TextField, Button, Alert} from '@mui/material'
import * as Devices from '/components/apis/devices'



export default function DeviceRegistration() {
  const [gotKey, setGotKey] = useState(false)
  const [errMsg, setErrMsg] = useState('')

  const handleRegister = () => {
    // todo: actually use device ID
    Devices.register()
      .then((data) => {
        setGotKey(true)
        const a = document.createElement('a')
        a.href = window.URL.createObjectURL(data)
        a.download = 'registration.zip'
        a.click()
      }).catch(err => {
        setGotKey(false)
        setErrMsg(err.message)
      })
  }


  return (
    <Root className="flex column">
      <h1>Get Development Beehive Keys for Your Waggle Device</h1>

      <h2>Enter Waggle Device ID</h2>
      <TextField
        id="nano-id"
        placeholder="Nano ID"
        style={{ width: 500 }}
        inputProps={{
          maxlength: 13
        }}
        required={true}
        disabled={gotKey}
      />

      <Button
        variant="contained"
        type="submit"
        id="publish-waggle"
        style={{ width: 120 }}
        onClick={handleRegister}
        disabled={gotKey}
      >
        {!gotKey ? 'Get Keys' :  'Got Keys!'}
      </Button>

      {gotKey &&
        <Alert severity="success">Check your download folder for registration keys!</Alert>
      }

      {errMsg &&
        <Alert severity="error">{errMsg}</Alert>
      }
    </Root>
  )
}


const Root = styled.div`
  margin: 40px 100px;

  > div, button {
    margin-bottom: 2em;
  }
`