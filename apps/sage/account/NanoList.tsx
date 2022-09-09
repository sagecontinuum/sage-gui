import { useState } from 'react'
import styled from 'styled-components'
import { TextField, Button, Alert } from '@mui/material'
import * as REGAPI from '/components/apis/regApi'


const Root = styled.div`
  display: flex;
  flex-direction: column;
  margin: 10px 100px;
`

export default function NanoList() {
  const [regKey, setRegKey] = useState(false)
  const [errMsg, setErrMsg] = useState('')
  const handlePublish = () => {

    REGAPI.register()
      .then((data) => {
        setRegKey(true)
        const a = document.createElement('a')
        a.href = window.URL.createObjectURL(data)
        a.download = 'registration.zip'
        a.click()
      }).catch(err => {
        setRegKey(false)
        setErrMsg(err.message)
      })


  }
  const inputProps = {
    minlength: 13,
    maxlength: 13,
    placeholder: 'Nano ID',
    required: true,

  }


  return (

    <Root>

      <h1>Get Development Beehive Keys for Your Waggle Device</h1>

      <h3 style={{ marginTop: 40 }}>Enter Waggle Device ID</h3>
      <TextField
        id="nano-id"
        variant="outlined"
        style={{ width: 500 }}
        inputProps={inputProps}
        error={false}
      />

      <br /><br />

      {regKey ?
        <Button
          variant="contained"
          type="submit"
          id="publish-waggle"
          disabled
          style={{ width: 120 }}
          onClick={handlePublish}
        >
          Got Keys!
        </Button>
        :
        <Button
          variant="contained"
          type="submit"
          id="publish-waggle"
          style={{ width: 120 }}
          onClick={handlePublish}
        >
          Get Keys
        </Button>
      }
      <br /><br />

      {regKey && <Alert severity="success" style={{ width: 500 }}>Check your download folder for registration keys!</Alert>}

      {errMsg && <Alert severity="error" style={{ width: 500 }}>{errMsg}</Alert>}

    </Root>
  )
}
