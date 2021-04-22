import React from 'react'
import styled from 'styled-components'
import { useLocation, useHistory } from 'react-router-dom'

import Button from '@material-ui/core/Button'

import * as Auth from '../../components/auth/auth'


export default function TestSignIn() {
  const location = useLocation()
  let history = useHistory()
  const params = new URLSearchParams(location.search)

  const [loading, setLoading] = React.useState(false)


  const handleSignIn = () => {
    const redirectPath = params.get('redirect')
    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      Auth.signIn()
      history.push(redirectPath || '/')
    }, 1500)
  }


  const handleSignOut = () => {
    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      Auth.signOut()
      history.push('/')
    }, 1500)
  }


  return (
    <Root className="flex column items-center">

      <p>This is a test sign-in page <b>for demo purposes</b>.</p>
      <br/>

      {Auth.isSignedIn() &&
        <p>You are already signed in.</p>
      }

      {!Auth.isSignedIn() ?
        <Button variant="contained" color="primary" onClick={handleSignIn} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
        :
        <Button variant="contained" color="primary" onClick={handleSignOut} disabled={loading}>
          {loading ? 'Signing out...' : 'Sign Out'}
        </Button>
      }
    </Root>
  )
}

const Root = styled.div`
  margin-top: 100px;

`
