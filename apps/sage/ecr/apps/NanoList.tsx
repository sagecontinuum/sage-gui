import { useState } from 'react'
import { Step } from '../../common/FormLayout'
import styled from 'styled-components'
import { TextField, Button } from '@mui/material'
import * as REGAPI from '/components/apis/regApi'


const Root = styled.div`
  display: flex;
  margin: 0 25px;
`

const Main = styled.div`
  margin: 10px 0;
  flex-grow: 3;

  .repo-step {
    margin-top: 6px;
    button, svg {
      margin-left: 10px;
    }
  }

  .register-app {
    margin-right: 10px;
  }
`

export default function NanoList() {
  const [regKey, setRegKey] = useState(false)

  const handlePublish = async () => {

    REGAPI.register()
      .then((data) => {
        setRegKey(true)
        const a = document.createElement('a')
        a.href = window.URL.createObjectURL(data)
        a.download = 'registration.zip'
        a.click()
      }).catch(err => console.log(err.message))

  }

  return (

    <Root>
      <Main>
        <h1>Get Development Beehive Keys for Your Waggle Device</h1>

        <Step>
          <h3 style={{ marginTop: 30 }}>Enter Waggle Device ID</h3>
          <TextField
            id="nano-id"
            label="Nano ID"
            variant="outlined"
            style={{ width: 500 }}
          />
        </Step>

        <Step>
          <Button
            variant="contained"
            type="submit"
            id="publish-waggle"
            style={{ width: 120 }}
            onClick={handlePublish}
          >
            Publish Waggle
          </Button>
        </Step>

        {regKey && <h5>Check your download folder for registration keys!</h5>}

      </Main>
    </Root>
  )
}
