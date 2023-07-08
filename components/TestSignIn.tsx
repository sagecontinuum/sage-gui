import React from 'react'
import styled from 'styled-components'
import { useLocation } from 'react-router-dom'

import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'

import Auth from '/components/auth/auth'


export default function TestSignIn() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)

  const [user, setUser] = React.useState('')
  const [token, setToken] = React.useState('')
  const [loading, setLoading] = React.useState(false)


  const handleSignIn = () => {
    const redirectPath = params.get('redirect')
    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      Auth.signIn(user, token)
      window.location.href = redirectPath || '/'
    }, 1000)
  }


  const handleSignOut = () => {
    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      Auth.signOut()
      window.location.href = '/'
    }, 1000)
  }

  const isValid = () => user && token


  return (
    <Root className="flex column items-center">
      <div>
        <p>
          <b>This is a sign-in page for testing and debugging</b>.<br/>

          {!Auth.isSignedIn &&
            <>
              Go <b><a href={`${Auth.url}/token`} target="__target" rel="noreferrer">here</a></b> to get
              a token and paste it below.
            </>
          }
        </p>

        {Auth.isSignedIn &&
          <p>You are already signed in.</p>
        }


        <div className="flex column">
          {!Auth.isSignedIn ?
            <>
              <TextField
                id="sage-debug-username"
                label="Username"
                onChange={evt => setUser(evt.target.value)}
              />
              <br/>
              <TextField
                id="sage-debug-token"
                label="Sage Token"
                onChange={evt => setToken(evt.target.value)}
              />
              <br/>
              <Button variant="contained" color="primary" onClick={handleSignIn} disabled={loading || !isValid()} type="submit">
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </>
            :
            <Button variant="contained" color="primary" onClick={handleSignOut} disabled={loading} type="submit">
              {loading ? 'Signing out...' : 'Sign Out'}
            </Button>
          }
        </div>
      </div>
    </Root>
  )
}

const Root = styled.form`
  margin-top: 100px;
  > div {
    max-width: 325px;
  }
`
