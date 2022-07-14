import { useState, ReactNode } from 'react'
import styled from 'styled-components'
import { Link, useLocation } from 'react-router-dom'
import sage from 'url:../assets/sage-drawing.png'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'

import AccountIcon from '@mui/icons-material/AccountCircleRounded'
import ExitIcon from '@mui/icons-material/ExitToApp'
import LaunchIcon from '@mui/icons-material/LaunchRounded'
import MenuItem from '@mui/material/MenuItem'
import Progress from '@mui/material/CircularProgress'

import DropdownMenu from '../components/Menu'


import * as Auth from '../components/auth/auth'
const username = Auth.username
const webOrigin = window.location.origin

const signOutUrl = `${Auth.url}/portal-logout`

import config from '../config'
import {version} from '../package.json'


type Props = {
  menu?: ReactNode
  logo?: ReactNode
  hasSignIn?: boolean
  hasDocsLink?: boolean
}

export default function NavBar(props: Props) {
  const {pathname} = useLocation()
  const { menu, hasSignIn, hasDocsLink, logo} = props


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
        <Divider orientation="vertical" flexItem style={{margin: '5px 0' }} />
      </div>

      {menu}

      <Spacer/>


      <div className="flex items-center gap">
        {hasDocsLink &&
          <NavItems>
            <li>
              <a
                href={`${config.docs}/about/overview`}
                target="_blank"
                rel="noreferrer"
              >
                Docs
                <LaunchIcon className="external-link" sx={{marginTop: '3px'}}/>
              </a>
            </li>
          </NavItems>
        }

        {hasSignIn && username &&
          <DropdownMenu
            label={
              <div className="flex items-center">
                <AccountIcon />&nbsp;{username}
              </div>
            }
            caret={false}
            menu={
              <DropDown>
                <MenuItem onClick={handleSignOut} disableRipple>
                  {signingOut ?
                    <><Progress size={20}/>&nbsp;Signing out...</> :
                    <><ExitIcon/>&nbsp;Sign out</>
                  }
                </MenuItem>
              </DropDown>
            }
          />
        }

        {hasSignIn && !username && pathname != '/login' &&
          <Button
            href={process.env.NODE_ENV == 'development' ? '/login' : `${Auth.url}/?callback=${webOrigin}${pathname}`}
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
  box-shadow:  0px 2px 4px -1px rgb(0 0 0 / 0%), 0px 4px 5px 0px rgb(0 0 0 / 0%), 0px 1px 10px 0px rgb(0 0 0 / 12%);
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
  display: flex;
  align-items: stretch;

  .MuiListItem-root {
    padding: 5px 10px;
  }
`




export const NavItems = styled.ul`
  list-style: none;
  margin-left: 20px;
  padding: 0;
  display: flex;
  font-size: 1.1em;

  li {
    position: relative;
  }

  li a {
    padding: 20px;
    color: #000;
    text-decoration: none;
  }

  li a:after {
    content: '';
    position: absolute;
    height: 0;
  }

  li a:not(.active) {
    opacity: .6;
    height: 0;
  }

  li a:not(.active):hover {
    opacity: 1.0;
  }

  li a:not(.active):hover:after {

  }

  .active {
    opacity: 1.0;
    height: 0;
  }

  li a.active:after {
    transition: height .2s ease;
    content: '';
    position: absolute;
    width: 16px;
    height: 8px;
    bottom: -17px;
    left: calc(50% - 8px);
    background: rgb(28, 140, 201);
    border-radius: 15px 15px 0 0;
  }
`



