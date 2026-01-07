import { styled } from '@mui/material'

import SageLogo from './SageLogo'
import NavItem, { Item } from './NavItem'
import ThemeSelector from './ThemeSelector'
import Divider from '@mui/material/Divider'

import {
  DeskRounded,
  MailOutlineRounded, ForumOutlined,
} from '@mui/icons-material'

import config from '/config'
import SignInButton from './SignInButton'



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
            {hasPortalLink &&
              <NavItem
                label="Portal"
                href={config.portal as string}
              />
            }
            <NavItem
              label="Labs"
              href={config.labs as string}
            />
            <NavItem
              label="Docs"
              href={`${config.docs}/about/overview`}
            />
            <NavItem
              label="Help"
              to={config.contactUs as string}
              menu={
                <div>
                  <Item
                    icon={<MailOutlineRounded />}
                    component="a"
                    href={config.contactUs as string}
                    target="_blank"
                    label="Contact Us"
                  />
                  <Item
                    icon={<ForumOutlined />}
                    component="a"
                    href={`${config.contactUs}#-join-us-on-slack` as string}
                    target="_blank"
                    label="Join Slack"
                  />
                  <Item
                    icon={<DeskRounded />}
                    component="a"
                    href={config.officeHours as string}
                    target="_blank"
                    label="Office Hours"
                  />
                </div>
              }
            />

            <ThemeSelector />
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
  border-bottom: 1px solid ${props => props.theme.palette.mode === 'dark' ?
    'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.15)'};
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
  margin-left: 10px;
`

export {NavItem, Item}


