import { styled } from '@mui/material'

import SageLogo from './SageLogo'
import NavItem, { Item } from './NavItem'
import Divider from '@mui/material/Divider'

import MailIcon from '@mui/icons-material/MailOutlineRounded'
import ForumIcon from '@mui/icons-material/ForumOutlined'
import LaunchIcon from '@mui/icons-material/LaunchRounded'

import config from '/config'
import SignInButton from './SignInButton'
import { IconButton, Tooltip, useColorScheme } from '@mui/material'
import { Brightness4, DarkModeOutlined, LightModeOutlined } from '@mui/icons-material'


type Props = {
  menu?: JSX.Element
  logo?: JSX.Element
  hasSignIn?: boolean
  hasDocsLink?: boolean
  hasPortalLink?: boolean
}

const isDev = () =>
  process.env.NODE_ENV == 'development'


export default function NavBar(props: Props) {
  const { menu, hasSignIn, hasDocsLink, hasPortalLink, logo } = props

  const {mode, systemMode, setMode} = useColorScheme()

  console.log('mode', mode, systemMode)

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
        <Tooltip
          title={<div className="text-center">
            Using {mode === 'system' ? 'system setting for color theme' : `${mode} color theme`}<br/>
            (Click to switch to {mode === 'light' ? 'dark' : (mode === 'dark' ? 'system' : 'light')} theme)
          </div>}>
          <IconButton
            onClick={() => {
              setMode(mode === 'light' ? 'dark' : (mode === 'dark' ? 'system' : 'light'))
            }}
          >
            {mode === 'light' && <LightModeOutlined />}
            {mode === 'dark' && <DarkModeOutlined />}
            {mode === 'system' && <Brightness4 />}
          </IconButton>
        </Tooltip>

        {hasDocsLink &&
          <NavItems>
            {hasPortalLink &&
              <NavItem
                label="Portal"
                href={config.portal}
              />
            }
            <NavItem
              label="Docs"
              href={`${config.docs}/about/overview`}
            />
            <NavItem
              label="Help"
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

        {hasSignIn && <SignInButton />}
      </div>


    </Root>
  )
}


const Root = styled('div')`
  display: flex;
  position: fixed;
  justify-content: space-between;
  align-items: center;
  top: 0;
  width: 100%;
  z-index: 9000;
  padding: 2px 20px 0 20px;
  height: 60px;
  border-bottom: 1px solid ${props => props.theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.15)'};
  background-color: ${props => props.theme.palette.background.paper};
  box-shadow:
    0px 2px 4px -1px rgb(0 0 0 / 0%),
    0px 4px 5px 0px rgb(0 0 0 / 0%),
    0px 1px 10px 0px rgb(0 0 0 / 12%);

  .docs-link {
    margin: 20px;
  }
`

const Spacer = styled('div')`
  flex-grow: 1;
`

export const NavItems = styled('div')`
  display: flex;
  height: 100%;
  font-size: 1.1em;
  margin-left: 20px;
`

export {NavItem, Item}


