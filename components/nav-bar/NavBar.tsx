import { useState, ReactNode } from 'react'
import styled from 'styled-components'
import { useLocation, Link } from 'react-router-dom'
import sage from 'url:/assets/sage-drawing.png'
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
import { version } from '/package.json'


type Props = {
  menu?: ReactNode
  logo?: ReactNode
  hasSignIn?: boolean
  hasDocsLink?: boolean
}

const isDev = () : boolean =>
  process.env.NODE_ENV == 'development'


export default function NavBar(props: Props) {
  const { pathname } = useLocation()
  const { menu, hasSignIn, hasDocsLink, logo } = props


  const [signingOut, setSigningOut] = useState(false)


  const handleSignOut = (evt) => {
    evt.stopPropagation()

    // display progress while signing out
    setSigningOut(true)
    Auth.signOut()
  }


  return (
    <Root>
      <div className="flex items-center">
        {logo ? logo :
          <a href={isDev() ? '/' : config.home} className="no-style flex items-center">
            <LogoImg src={sage} height="35" />
            <Logo title={`Sage: v${version}`}>
                Sage
              <sup>(beta)</sup>
            </Logo>
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
              style={{left: '-30px'}}
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

        {hasSignIn && username &&
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
                  label="Shared Nodes"
                />
                <Item
                  icon={<AccessIcon />}
                  to='/account/access'
                  label="Access Creds"
                />
                {/* hide dev devices for now <Item
                  icon={<DevicesIcon />}
                  to='/account/dev-devices'
                  label="Dev Devices"
                /> */}
                <Divider />
                <Item
                  onClick={handleSignOut}
                  icon={signingOut ?  <Progress size={20} /> : <ExitIcon />}
                  to="/jobs/timeline"
                  label={signingOut ? 'Signing out...' : 'Sign out'}
                />
              </div>
            }
          />
        }

        {hasSignIn && !username && pathname != '/login' &&
          <Button
            href={isDev() ? '/login' : `${Auth.url}/?callback=${webOrigin}${pathname}`}
            variant="outlined"
            color="primary"
            sx={{marginLeft: '20px'}}
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

  .docs-link {
    margin: 20px;
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


