import { useState, ReactNode } from 'react'
import styled from 'styled-components'
import { useLocation } from 'react-router-dom'

import SageLogo from './SageLogo'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'

import AccountIcon from '@mui/icons-material/AccountCircleRounded'
import NodesIcon from '@mui/icons-material/HubOutlined'
import AccessIcon from '@mui/icons-material/LockOutlined'
import MailIcon from '@mui/icons-material/MailOutlineRounded'
import ForumIcon from '@mui/icons-material/ForumOutlined'
// import DevicesIcon from '@mui/icons-material/DeviceHubRounded'
import ExitIcon from '@mui/icons-material/ExitToApp'
import LaunchIcon from '@mui/icons-material/LaunchRounded'
import Progress from '@mui/material/CircularProgress'

import NavItem, { Item } from './NavItem'
import Auth from '/components/auth/auth'

const username = Auth.user
const webOrigin = window.location.origin

import config from '/config'
import SignInButton from './SignInButton'


type Props = {
  menu?: ReactNode
  logo?: ReactNode
  hasSignIn?: boolean
  hasDocsLink?: boolean
  isAdmin?: boolean
}

const isDev = () =>
  process.env.NODE_ENV == 'development'


export default function NavBar(props: Props) {
  const { menu, hasSignIn, isAdmin, hasDocsLink, logo } = props

  return (
    <Root>
      <div className="flex items-center">
        {logo ? logo :
          <a href={isDev() ? '/' : config.home} className="no-style flex items-center">
            <SageLogo />
          </a>
        }
        <Divider orientation="vertical" flexItem style={{ margin: '5px 0' }} />
      </div>

      {menu}

      <Spacer />

      <div className="flex items-center">
        {hasDocsLink &&
          <NavItems>
            <NavItem
              label="Docs"
              href={`${config.docs}/about/overview`}
            />
            <NavItem
              label="Help"
              style={{left: '-80px'}}
              menu={
                <div>
                  <Item
                    icon={<MailIcon />}
                    component="a"
                    href={config.contactUs}
                    label={<>Contact us</>}
                  />
                  <Item
                    icon={<ForumIcon />}
                    component="a"
                    href={config.ghDiscussions}
                    target="_blank"
                    label={<>Discussions&nbsp;<LaunchIcon style={{fontSize: '1.1em'}} /></>}
                  />
                </div>
              }
            />
          </NavItems>
        }

        {hasSignIn && <SignInButton isAdmin={isAdmin} />}
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

  .docs-link {
    margin: 20px;
  }
`

const Spacer = styled.div`
  flex-grow: 1;
`

export const NavItems = styled.div`
  display: flex;
  height: 100%;
  font-size: 1.1em;
  margin-left: 20px;
`

export {NavItem, Item}


