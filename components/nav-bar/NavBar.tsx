import { useEffect, useState } from 'react'
import styled from 'styled-components'

import SageLogo from './SageLogo'
import NavItem, { Item } from './NavItem'
import Divider from '@mui/material/Divider'

import MailIcon from '@mui/icons-material/MailOutlineRounded'
import ForumIcon from '@mui/icons-material/ForumOutlined'
import LaunchIcon from '@mui/icons-material/LaunchRounded'

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

  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    return
    const fetchConfig = async () => {
      const response = await fetch(
        'https://raw.githubusercontent.com/waggle-sensor/sage-website/main/docusaurus.config.js'
      )
      const text = await response.text()
      console.log('Fetched config:', text)

      // parse the config to extract announcementBar
      const match = text.match(/announcementBar:\s*{([^}]+)}/)
      if (match) {
        const configText = match[1].trim()
        const lines = configText.split('\n').map(line => line.trim())
        type AnnouncementBar = { [key: string]: string }
        const announcementBar = lines.reduce<AnnouncementBar>((acc, line) => {
          const kv = line.match(/^(\w+):\s*(.+)$/)
          if (kv) {
            const key = kv[1]
            // Preserve everything after the first colon, including colons and HTML tags
            const value = kv[2].trim().replace(/['",]$/g, '').replace(/^['"]|['"]$/g, '')
            acc[key] = value
          }
          return acc
        }, {})

        setNotice(announcementBar)
      } else {
        // console.error('No announcementBar found in config')
      }
    }

    fetchConfig()
  }, [])
  // console.log('NavBar rendered')

  return (
    <Root>
      {notice &&
        <div className="announcement-bar">
          {/* Object.entries(notice).map(([key, value]) => (
            <div key={key} className="announcement-item">
              <strong>{key}:</strong> {value}
            </div>
          ))*/}
        </div>
      }

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
                href={config.portal}
              />
            }
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

        {hasSignIn && <SignInButton />}
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


