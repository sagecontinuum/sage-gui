import { lazy, Suspense, useEffect, useState } from 'react'
import ReactDom from 'react-dom'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import styled from 'styled-components'

import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import PublicIcon from '@mui/icons-material/PublicRounded'
import UserIcon from '@mui/icons-material/AccountCircleRounded'
import JobsIcon from '@mui/icons-material/ListRounded'
import ChartIcon from '@mui/icons-material/TimelineRounded'
import ChartBrowserIcon from '@mui/icons-material/QueryStatsRounded'
import MyJobsIcon from '@mui/icons-material/Engineering'
import AddIcon from '@mui/icons-material/AddRounded'

import MetaRoute from '/components/Meta'
import NavBar, { NavItems } from '/components/nav-bar/NavBar'
import NavItem, { Item } from '/components/nav-bar/NavItem'
import Progress from '/components/progress/LazyLoading'

import AppList from './ecr/apps/AppList'
import App from './ecr/app/App'
import CreateApp from './ecr/create-app/CreateApp'

import NodeTabs from '/components/views/nodes/NodeTabs'
import Nodes from '/components/views/nodes/Nodes'
import Node from '/components/views/node/Node'
import Sensor from '/components/views/sensor/Sensor'
import SensorList from '/components/views/sensor/SensorList'
import Apps from './ecr/apps/Apps'
import Jobs from './jobs/Jobs'
import JobStatus from './jobs/JobStatus'
const CreateJob = lazy(() => import('./jobs/create-job/CreateJob'))

import QueryBrowser from './data-stream/QueryBrowser'
import ImageSearch from './image-search/ImageSearch'
import Ontology from './data-commons/Ontology'
import Data from './data/Data'
import DataProductSearch from './data-commons/DataProductSearch'
import DataProduct from './data-commons/DataProduct'

import Account from '/components/account/Account'
import UserProfile from '/components/account/UserProfile'
import MyNodes from '/components/account/MyNodes'
import Devices from '/components/account/Devices'
import DevAccess from '/components/account/DevAccess'
import AllocationRequest from './allocations/AllocationRequest'

import Assistant from './assist/Assistant'

import TestDownload from './fiddle/test-download'

import RequireAuth from '/components/auth/RequireAuth'
import TestSignIn from '/components/TestSignIn'
import NotFound from '/components/404'

import { PermissionProvider } from '/components/auth/PermissionProvider'
import { ProgressProvider } from '/components/progress/ProgressProvider'
import { SnackbarProvider } from 'notistack'

import theme from '/components/theme'
import '/assets/styles.scss'

import Auth from '/components/auth/auth'
import settings from '/components/settings'
import { Alert } from '@mui/material'

import config, { Notice } from '/config'
const {project} = settings


const NavMenu = () => {
  return (
    <NavItems>
      <NavItem
        label="Nodes"
        to="/nodes"
      />
      <NavItem
        label="App Catalog"
        root="/apps"
        to="/apps"
        menu={
          <>
            <Item
              icon={<PublicIcon/>}
              to="/apps/explore"
              label="Public Apps"
            />
            <Item
              icon={<UserIcon/>}
              to="/apps/my-apps"
              label="My Apps"
            />
            {Auth.isSignedIn &&
              <Item
                icon={<AddIcon/>}
                to="/apps/create-app"
                label="Create App"
              />
            }
          </>
        }
      />
      <NavItem
        label="Job Status"
        root="/jobs"
        to="/jobs"
        menu={
          <>
            <Item
              icon={<JobsIcon/>}
              to="/jobs/all-jobs"
              label="Job Status"
            />

            {Auth.isSignedIn &&
              <>
                <Item
                  icon={<MyJobsIcon/>}
                  to="/jobs/my-jobs"
                  label="My Jobs"
                />
                <Item
                  icon={<AddIcon/>}
                  to="/jobs/create-job"
                  label="Create Job"
                />
              </>
            }
          </>
        }
      />
      <NavItem
        label="Data"
        root="/data"
        to="/data"
        menu={
          <>
            <Item
              icon={<ChartIcon/>}
              to="/data"
              label="Data"
            />
            <Item
              icon={<ChartBrowserIcon/>}
              to="/query-browser"
              label="Query Browser"
            />
          </>
        }
      />
    </NavItems>
  )
}


/*
const Notice = () =>
  <Alert severity="warning" style={{borderBottom: '1px solid #ddd' }}>
    Our team is currently doing maintenance on this application.
  </Alert>
*/


export default function Sage() {

  const [notice, setNotice] = useState<Notice>(null)

  useEffect(() => {
    if (config.notice) {
      // Use notice from config if available
      setNotice(config.notice)
    } else if (config.noticeURL) {
      // Fetch notice from external URL if provided
      fetch(config.noticeURL)
        .then(res => res.json())
        .then(data => {
          if (data.message) {
            setNotice(data)
          }
        })
        .catch(err => console.error('Error fetching notice:', err))
    }
  }, [])

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme} defaultMode="light" noSsr>
        <CssBaseline/>

        <BrowserRouter>
          <NavBar menu={<NavMenu />} hasSignIn hasDocsLink />

          <PermissionProvider>
            <SnackbarProvider autoHideDuration={3000} preventDuplicate maxSnack={2}>
              <Container>
                {notice &&
                  <Alert severity={notice.severity || 'info'} onClose={() => setNotice(null)}>
                    <b>{notice.message}</b>
                  </Alert>
                }

                <ProgressProvider>
                  <Routes>
                    <Route path="/" element={<Navigate to="nodes" replace />} />

                    <Route path='/' element={<MetaRoute />}>

                      <Route path="/" element={<NodeTabs />}>
                        <Route path="nodes" element={<Nodes />} />
                        <Route path="all-nodes" element={<Nodes />} />
                        <Route path="sensors" element={<SensorList project={project} />} />
                      </Route>
                      <Route path="sensors/:name" element={<Sensor />} />

                      <Route path="node/:vsn" element={<Node />} />

                      <Route path="/apps" element={<Navigate to="/apps/explore" replace />} />
                      <Route path="apps" element={<Apps />}>
                        <Route path="explore" element={<AppList />} />
                        <Route path="app/*" element={<App />} />
                        <Route path="my-apps" element={<RequireAuth><AppList /></RequireAuth>} />
                        <Route  path="create-app" element={<RequireAuth><CreateApp /></RequireAuth>} />
                      </Route>

                      <Route path="/jobs" element={<Navigate to="/jobs/all-jobs" replace />} />
                      <Route path="jobs" element={<Jobs />}>
                        <Route path="create-job" element={<Suspense fallback={<Progress/>}><CreateJob/></Suspense>} />
                        <Route path=":view" element={<JobStatus />} />
                      </Route>

                      <Route path="data" element={<Data project={project} />} />
                      <Route path="data/ontology/:name" element={<Ontology />} />
                      <Route path="data/product/:name" element={<DataProduct />} />
                      <Route path="query-browser" element={<QueryBrowser />} />
                      <Route path="/labs/image-search" element={<ImageSearch />} />

                      <Route path="data-commons-demo" element={<DataProductSearch />} />

                      <Route path="account" element={<RequireAuth><Account /></RequireAuth>}>
                        <Route path="profile" element={<RequireAuth><UserProfile /></RequireAuth>} />
                        <Route path="nodes" element={<RequireAuth><MyNodes /></RequireAuth>} />
                        <Route path="dev-devices" element={<RequireAuth><Devices /></RequireAuth>} />
                        <Route path="access" element={<RequireAuth><DevAccess /></RequireAuth>} />
                      </Route>

                      <Route path="request-allocation" element={<RequireAuth><AllocationRequest /></RequireAuth>} />

                      <Route path="assistant" element={<Assistant />} />

                      <Route path="fiddle/test-download" element={<TestDownload />} />

                      <Route path="login" element={<TestSignIn />} />
                      <Route path="*" element={<NotFound />} />

                    </Route>
                  </Routes>
                </ProgressProvider>
              </Container>
            </SnackbarProvider>
          </PermissionProvider>
        </BrowserRouter>
      </ThemeProvider>
    </StyledEngineProvider>
  )
}

const Container = styled.div`
  margin: 60px 0 0 0;
  width: 100%;
`

/* mocking data example, using msw
async function enableMocking() {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  const { worker } = await import('/mocks/browser')

  // `worker.start()` returns a Promise that resolves
  // once the Service Worker is up and ready to intercept requests.
  await worker.start()
}

enableMocking().then(() => {
  ReactDom.render(<Sage />, document.getElementById('app'))
})
*/


ReactDom.render(<Sage />, document.getElementById('app'))
