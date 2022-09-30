import { useState, ReactNode } from 'react'
import styled from 'styled-components'
import { Link, useLocation } from 'react-router-dom'
import sage from 'url:/assets/sage-drawing.png'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'

import ListItemIcon from '@mui/material/ListItemIcon'
import AccountIcon from '@mui/icons-material/AccountCircleRounded'
import ExitIcon from '@mui/icons-material/ExitToApp'
import LaunchIcon from '@mui/icons-material/LaunchRounded'
import DevicesIcon from '@mui/icons-material/Devices'
import Progress from '@mui/material/CircularProgress'

import NavItem, { Item } from './NavItem'
// import Menu, {MenuItem} from '../menus/MenuButton'
import * as Auth from '/components/auth/auth'

const username = Auth.username
const webOrigin = window.location.origin

const signOutUrl = `${Auth.url}/portal-logout`

import config from '../../config'
import { version } from '../../package.json'


type Props = {
  menu?: ReactNode
  logo?: ReactNode
  hasSignIn?: boolean
  hasDocsLink?: boolean
}

export default function NavBar(props: Props) {
  const { pathname } = useLocation()
  const { menu, hasSignIn, hasDocsLink, logo } = props


  const [signingOut, setSigningOut] = useState(false)


  const handleSignOut = (evt) => {
    evt.stopPropagation()

    // display progress while signing out
    setSigningOut(true)
    Auth.signOut()

    window.location.href = `${signOutUrl}/?callback=${webOrigin}`
  }


  return (
    <Root>
      <div className="flex items-center">
        <Link to="/" className="no-style flex items-center">
          {logo ? logo :
            <>
              <LogoImg src={sage} height="35" />
              <Logo title={`Sage: v${version}`}>
                Sage
                <sup>(beta)</sup>
              </Logo>
            </>
          }
        </Link>
        <Divider orientation="vertical" flexItem style={{ margin: '5px 0' }} />
      </div>

      {menu}

      <Spacer />


      <div className="flex items-center gap">
        {hasDocsLink &&
          <NavItems>
            <a
              href={`${config.docs}/about/overview`}
              className="no-style"
              target="_blank"
              rel="noreferrer"
            >
              Docs
              <LaunchIcon className="external-link" sx={{ marginTop: '3px' }} />
            </a>
          </NavItems>
        }

        {hasSignIn && username &&
          <NavItem
            label={
              <div className="flex items-center">
                <AccountIcon />&nbsp;{username}
              </div>
            }
            menu={
              <div style={{left: '-100px'}}>
                <Item
                  icon={<AccountIcon />}
                  to='/my-profile'
                  label="My profile"
                />
                <Item
                  icon={<DevicesIcon/>}
                  to='/my-devices'
                  label="My devices goals"
                />
                <Divider />
                <Item
                  onClick={handleSignOut}
                  icon={signingOut ?  <Progress size={20} /> : <ExitIcon />}
                  to="/job-status/timeline"
                  label={signingOut ? 'Signing out...' : 'Sign out'}
                />
              </div>
            }
          />
        }

        {hasSignIn && !username && pathname != '/login' &&
          <Button
            href={
              process.env.NODE_ENV == 'development' ?
                '/login' : `${Auth.url}/?callback=${webOrigin}${pathname}`
            }
            variant="outlined"
            color="primary"
          >
            Sign In
          </Button>
        }
      </div>

    </Root>
  )
}

const Root = styled.div`
  display: flex;
  position: fixed;
  justify-content: space-between;
  align-items: center;
  top: 0;
  width: 100%;
  background: #fff;
  z-index: 9000;
  padding: 2px 20px 0 20px;
  height: 60px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  box-shadow:
    0px 2px 4px -1px rgb(0 0 0 / 0%),
    0px 4px 5px 0px rgb(0 0 0 / 0%),
    0px 1px 10px 0px rgb(0 0 0 / 12%);
`

const LogoImg = styled.img`
  margin-bottom: 2px;
`

const Logo = styled.span`
  font-size: 2.2em;
  font-family: 'Open sans', sans-serif;
  font-weight: 800;
  color: #87baa6;
  margin-bottom: 2px;
  padding-right: 20px;
  padding-left: 2px;

  sup {
    position: relative;
    top: -5px;
    font-size: .3em;
    color: #aaa;
  }
`

const Spacer = styled.div`
  flex-grow: 1;
`

const DropDown = styled.div`
  align-items: stretch;

  .MuiListItem-root {
    padding: 5px 10px;
  }
`

export const NavItems = styled.div`
  display: flex;
  height: 100%;
  font-size: 1.1em;
  padding: 0;
`

export {NavItem, Item}


