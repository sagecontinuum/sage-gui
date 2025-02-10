import ReactDom from 'react-dom'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import styled from 'styled-components'

import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import MetaRoute from '/components/Meta'
import { AdminLogo } from '/components/nav-bar/SageLogo'
import NavBar, { NavItems, NavItem } from '/components/nav-bar/NavBar'
import { Item } from '/components/nav-bar/NavItem'
import NodeTabs from '/components/views/nodes/NodeTabsBinned'
import Node from '/components/views/node/Node'
import Status from './views/status/Status'
import Tests from './views/tests/Tests'
import SuryaStatus from './views/factory/Factory'
// import AudioTests from './views/tests/AudioTests'
import ImageTests from './views/tests/ImageTests'
import DescriptionTests from './views/tests/DescriptionTests'
import Metrics from './views/metrics/Metrics'

import MonitorIcon from '@mui/icons-material/MonitorHeartOutlined'
import ImageIcon from '@mui/icons-material/ImageOutlined'

import Timeline from './fiddle/TimelineFiddle'

import { PermissionProvider } from '/components/auth/PermissionProvider'
import { ProgressProvider } from '/components/progress/ProgressProvider'

import theme from '/components/theme'
import '/assets/styles.scss'

import Account from '/components/account/Account'
import UserProfile from '/components/account/UserProfile'
import MyNodes from '/components/account/MyNodes'
import Devices from '/components/account/Devices'
import DevAccess from '/components/account/DevAccess'

import RequireAuth from '/components/auth/RequireAuthAdmin'
import TestSignIn from '/components/TestSignIn'
import NotFound from '/components/404'

import Auth from '/components/auth/auth'


const NavMenu = () => {
  if (!Auth.user)
    return <></>

  return (
    <NavItems>
      <NavItem label="Nodes" to="/nodes?phase=deployed" />
      <NavItem label="Factory" to="/surya" />
      <NavItem label="Metrics" to="/metrics" />
      <NavItem label="Experiments" to="/ai/experiments" />
      <NavItem
        label="Tests"
        root="/tests"
        menu={
          <>
            <Item
              icon={<MonitorIcon/>}
              to="/tests/?phase=deployed"
              label="Health/Sanity"
            />
            <Item
              icon={<ImageIcon/>}
              to="/tests/images"
              label="Images"
            />
          </>
        }
      />
    </NavItems>
  )
}



export default function App() {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <CssBaseline/>
          <NavBar
            menu={<NavMenu />}
            logo={
              <a href="/" className="no-style flex items-center">
                <AdminLogo />
              </a>
            }
            hasSignIn
            hasDocsLink
            hasPortalLink
          />

          <PermissionProvider>
            <Container>
              <ProgressProvider>
                <Routes>
                  <Route path='/' element={<MetaRoute />}>
                    <Route element={<RequireAuth />}>
                      <Route path="/" element={<Navigate to="nodes?phase=deployed" replace />} />

                      <Route path="/" element={<NodeTabs includeSensors={false} isAdmin />}>
                        <Route path="nodes" element={<Status />} />
                        <Route path="tests" element={<Tests />} />
                      </Route>
                      <Route path="/node/:vsn" element={<Node admin />} />

                      {/* <Route path="tests/audio" element={<AudioTests />} />*/}
                      <Route path="tests/images" element={<ImageTests />} />
                      <Route path="ai/experiments" element={<DescriptionTests />} />

                      <Route path="metrics" element={<Metrics />} />

                      <Route path="surya" element={<Navigate to="/surya/phase2" replace />} />
                      <Route path="surya/:phase" element={<SuryaStatus />} />

                      <Route path="fiddle/timeline" element={<Timeline />} />

                      <Route path="*" element={<NotFound />} />
                    </Route>

                    <Route path="account" element={<Account />}>
                      <Route path="profile" element={<UserProfile />} />
                      <Route path="nodes" element={<MyNodes />} />
                      <Route path="dev-devices" element={<Devices />} />
                      <Route path="access" element={<DevAccess />} />
                    </Route>

                    <Route path="login" element={<TestSignIn />} />
                  </Route>
                </Routes>
              </ProgressProvider>
            </Container>
          </PermissionProvider>
        </BrowserRouter>
      </ThemeProvider>
    </StyledEngineProvider>
  )
}

const Container = styled.div`
  margin: 60px 0;
  width: 100%;
`


ReactDom.render(<App />, document.getElementById('app'))
