import { useState } from 'react'
import { useLocation } from 'react-router-dom'

import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'

import AccountIcon from '@mui/icons-material/AccountCircleRounded'
import NodesIcon from '@mui/icons-material/HubOutlined'
import AccessIcon from '@mui/icons-material/LockOutlined'
import ExitIcon from '@mui/icons-material/ExitToApp'
import Progress from '@mui/material/CircularProgress'

import NavItem, { Item } from './NavItem'
import Auth from '/components/auth/auth'

const username = Auth.user
const webOrigin = window.location.origin


const isDev = () =>
  process.env.NODE_ENV == 'development'


type Props = {
  isAdmin?: boolean
}

export default function SignInButton(props: Props) {
  const {pathname, search} = useLocation()
  const {isAdmin} = props

  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = (evt) => {
    evt.stopPropagation()

    // display progress while signing out
    setSigningOut(true)
    Auth.signOut()
  }

  return (
    <>
      {username && !isAdmin &&
        <NavItem
          label={
            <div className="flex items-center">
              <AccountIcon />&nbsp;{username}
            </div>
          }
          style={{left: '-30px'}}
          menu={
            <div>
              <Item
                icon={<AccountIcon />}
                to='/account/profile'
                label="Account"
              />
              <Item
                icon={<NodesIcon />}
                to='/account/nodes'
                label="My Nodes"
              />
              <Item
                icon={<AccessIcon />}
                to='/account/access'
                label="Access Creds"
              />
              <Divider />
              <Item
                onClick={handleSignOut}
                to="/signout" // just for styling for now(?); stopPropagation is on handleSignOut
                icon={signingOut ?  <Progress size={20} /> : <ExitIcon />}
                label={signingOut ? 'Signing out...' : 'Sign out'}
              />
            </div>
          }
        />
      }

      {isAdmin && username &&
        <NavItem
          label={
            <div className="flex items-center">
              <AccountIcon />&nbsp;{username}
            </div>
          }
          style={{left: '-20px'}}
          menu={
            <div style={{padding: 10}}>
              Please sign out via the <b><a href="https://portal.sagecontinuum.org">portal</a></b>.
            </div>
          }
        />
      }

      {!username && pathname != '/login' &&
        <Button
          href={`${isDev() ? '/login' : Auth.url}?callback=${webOrigin}${pathname}${search}`}
          variant="outlined"
          color="primary"
          sx={{marginLeft: '20px'}}
        >
          Sign In
        </Button>
      }
    </>
  )
}

