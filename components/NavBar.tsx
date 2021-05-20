import React from 'react'
import styled from 'styled-components'
import { Link, useLocation} from 'react-router-dom'
import sage from 'url:../assets/sage-drawing.png'
import Button from '@material-ui/core/Button'
import Divider from '@material-ui/core/Divider'

import AccountIcon from '@material-ui/icons/AccountCircleRounded'
import ExitIcon from '@material-ui/icons/ExitToApp'
import MenuItem from '@material-ui/core/MenuItem'

import DropdownMenu from '../components/Menu'

import * as Auth from '../components/auth/auth'

const username = Auth.getUser()


type Props = {
  hasSignIn?: boolean
  Menu?: React.FC
}

export default function NavBar(props: Props) {
  const {pathname} = useLocation()
  const { Menu, hasSignIn} = props

  const handleSignOut = () => {
    Auth.signOut()
    window.location.href = '/'
  }

  return (
    <Root className="flex items-center justify-between">
      <div className="flex items-center">
        <Link to="/" className="no-style flex items-center">
          <LogoImg src={sage} height="35" />
          <Logo>
            Sage
            <sup>(beta)</sup>
          </Logo>
        </Link>
        <Divider orientation="vertical" flexItem style={{margin: '5px 0' }} />
        {Menu && <Menu />}
      </div>

      {hasSignIn && username &&
        <DropdownMenu
          label={
            <div className="flex items-center">
              <AccountIcon />&nbsp;{username.split('@')[0]}
            </div>
          }
          caret={false}
          style={{minWidth: 1, margin: 0}}
          menu={
            <DropDown>
              <div>

                <MenuItem onClick={handleSignOut} disableRipple>
                  <ExitIcon/>&nbsp;Sign out
                </MenuItem>
              </div>
            </DropDown>
          }
        />
      }

      {hasSignIn && !username && pathname != '/login' &&
          <Button
            component={Link}
            to="/login"
            variant="outlined"
            color="primary"
          >
            Sign In
          </Button>

      }
    </Root>
  )
}

const Root = styled.div`
  flex-shrink: 0;
  position: fixed;
  top: 0;
  width: 100%;
  background: #fff;
  z-index: 1000;
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  box-shadow:  0px 2px 4px -1px rgb(0 0 0 / 0%), 0px 4px 5px 0px rgb(0 0 0 / 0%), 0px 1px 10px 0px rgb(0 0 0 / 12%);

  .title {
    margin: 4px 20px 0 20px;
    font-weight: 600;
  }
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

const DropDown = styled.div`
  display: flex;
  align-items: stretch;

  .MuiListItem-root {
    padding: 5px 10px;
  }
`



