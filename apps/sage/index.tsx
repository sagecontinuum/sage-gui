import { lazy, Suspense } from 'react'
import ReactDom from 'react-dom'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import styled from 'styled-components'

import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import PublicIcon from '@mui/icons-material/PublicRounded'
import UserIcon from '@mui/icons-material/AccountCircleRounded'
import JobsIcon from '@mui/icons-material/ListRounded'
import TimelineIcon from '@mui/icons-material/ViewTimelineOutlined'
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
import RequireAuth from '/components/auth/RequireAuth'

import NodeTabs from '/components/views/nodes/NodeTabs'
import Nodes from '/components/views/nodes/Nodes'
import Node from '/components/views/node/Node'
import Sensor from '/components/views/sensor/Sensor'
import SensorList from '/components/views/sensor/SensorList'
import Apps from './ecr/apps/Apps'
import JobStatus from './jobs/JobStatus'
const CreateJob = lazy(() => import('./jobs/create-job/CreateJob'))

import DataBrowser from './data-stream/DataBrowser'
import Ontology from './data-commons/Ontology'
import Data from './data/Data'
import DataProductSearch from './data-commons/DataProductSearch'
import DataProduct from './data-commons/DataProduct'

import Account from './account/Account'
import UserProfile from './account/UserProfile'
import MyNodes from './account/MyNodes'
import Devices from './account/Devices'
import DevAccess from './account/DevAccess'

import TestSignIn from '/components/TestSignIn'
import NotFound from '/components/404'

import { ProgressProvider } from '/components/progress/ProgressProvider'
import { SnackbarProvider } from 'notistack'

import theme from '/components/theme'
import '/assets/styles.scss'

import Auth from '/components/auth/auth'
import settings from '/components/settings'



const NavMenu = () => {
  return (
    <NavItems>
      <NavItem
        label="Nodes"
        to={`/nodes?status="reporting"`}
      />
      <NavItem
        label="App Catalog"
        root="/apps"
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
        menu={
          <>
            <Item
              icon={<JobsIcon/>}
              to="/jobs/all-jobs"
              label="Job Status"
            />
            <Item
              icon={<TimelineIcon/>}
              to="/jobs/timeline"
              label="Timelines"
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
                  to="/create-job"
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

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline/>

        <BrowserRouter>
          <NavBar menu={<NavMenu />} hasSignIn hasDocsLink />

          <SnackbarProvider autoHideDuration={3000} preventDuplicate maxSnack={2}>
            <Container>
              <ProgressProvider>
                <Routes>
                  <Route path="/" element={<Navigate to={`nodes?status="reporting"`} replace />} />

                  <Route path='/' element={<MetaRoute />}>

                    <Route path="/" element={<NodeTabs />}>
                      <Route
                        path="nodes"
                        element={<Nodes />} />
                      <Route
                        path="sensors"
                        element={<SensorList />} />
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
                    <Route path="jobs" element={<JobStatus />}>
                      <Route path=":view" element={<JobStatus />} />
                    </Route>

                    <Route path="create-job" element={
                      <Suspense fallback={<Progress/>}><CreateJob/></Suspense>
                    }/>

                    <Route path="data" element={<Data project={settings.project} focus={settings.focus} />} />
                    <Route path="data/ontology/:name" element={<Ontology />} />
                    <Route path="data/product/:name" element={<DataProduct />} />
                    <Route path="query-browser" element={<DataBrowser />} />

                    <Route path="data-commons-demo" element={<DataProductSearch />} />

                    <Route path="account" element={<RequireAuth><Account /></RequireAuth>}>
                      <Route path="profile" element={<RequireAuth><UserProfile /></RequireAuth>} />
                      <Route path="nodes" element={<RequireAuth><MyNodes /></RequireAuth>} />
                      <Route path="dev-devices" element={<RequireAuth><Devices /></RequireAuth>} />
                      <Route path="access" element={<RequireAuth><DevAccess /></RequireAuth>} />
                    </Route>

                    <Route path="login" element={<TestSignIn />} />
                    <Route path="*" element={<NotFound />} />

                  </Route>
                </Routes>
              </ProgressProvider>
            </Container>
          </SnackbarProvider>
        </BrowserRouter>
      </ThemeProvider>
    </StyledEngineProvider>
  )
}

const Container = styled.div`
  margin: 60px 0 0 0;
  width: 100%;
`


ReactDom.render(<Sage />, document.getElementById('app'))
