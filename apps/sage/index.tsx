import ReactDom from 'react-dom'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import styled from 'styled-components'

import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import PublicIcon from '@mui/icons-material/PublicRounded'
import UserIcon from '@mui/icons-material/AccountCircleRounded'
import JobsIcon from '@mui/icons-material/ListRounded'
import TimelineIcon from '@mui/icons-material/ViewTimelineOutlined'
import ChartIcon from '@mui/icons-material/TimelineRounded'
import ChartBrowserIcon from '@mui/icons-material/QueryStatsRounded'
import SageIcon from '@mui/icons-material/YardOutlined'
import DevIcon from '@mui/icons-material/DataObject'
import VTOIcon from '@mui/icons-material/FlightTakeoff'
import DAWNIcon from '@mui/icons-material/ScienceOutlined'
import WFOIcon from '@mui/icons-material/WorkspacesOutlined'
import SensorIcon from '@mui/icons-material/SensorsRounded'
import MyJobsIcon from '@mui/icons-material/Engineering'
import AddIcon from '@mui/icons-material/AddRounded'

import NavBar, { NavItems } from '/components/nav-bar/NavBar'
import NavItem, { Item } from '/components/nav-bar/NavItem'

import AppList from './ecr/apps/AppList'
import App from './ecr/app/App'
import CreateApp from './ecr/create-app/CreateApp'
import RequireAuth from '/components/auth/RequireAuth'

import Apps from './ecr/apps/Apps'
import Nodes from '/components/views/nodes/Nodes'
import Node from '/components/views/node/Node'
import Sensor from '/components/views/sensor/Sensor'
import SensorList from '/components/views/sensor/SensorList'
import JobStatus from './jobs/JobStatus'
import CreateJob from './jobs/create-job/CreateJob'
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
import Home from './home/home.tsx'

import TestSignIn from './sign-in/TestSignIn'
import NotFound from '/components/404'

import { ProgressProvider } from '/components/progress/ProgressProvider'
import { SnackbarProvider } from 'notistack'

import theme from '/components/theme'
import '/assets/styles.scss'

import Auth from '/components/auth/auth'
import { Divider } from '@mui/material'




const NavMenu = () => {
  return (
    <NavItems>
      <NavItem
        label="Nodes"
        root="/nodes"
        menu={
          <>
            <Item
              icon={<PublicIcon/>}
              component={Link}
              to="/nodes"
              label="All nodes"
            />
            <Divider sx={{width: '170px'}} />
            <Item
              icon={<SageIcon />}
              component={Link}
              to='/nodes/?project="SAGE"'
              label="Sage"
            />
            <Item
              icon={<DevIcon />}
              component={Link}
              to='/nodes/?project="DEV"'
              label="Dev"
            />
            <Item
              icon={<VTOIcon />}
              component={Link}
              to='/nodes/?project="VTO"'
              label="VTO"
            />
            <Item
              icon={<DAWNIcon />}
              component={Link}
              to='/nodes/?project="DAWN"'
              label="DAWN"
            />
            <Item
              icon={<WFOIcon />}
              component={Link}
              to='/nodes/?project="WFO"'
              label="WFO"
            />
            <Divider />
            <Item
              icon={<SensorIcon />}
              component={Link}
              to='/sensors'
              label="Sensors"
            />
          </>
        }
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
              label="Data Browser"
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
                  <Route path="/" element={<Navigate to="nodes" replace />} />

                  <Route path="nodes" element={<NodeList><Nodes /></NodeList>} />
                  <Route path="node/:node" element={<Node />} />
                  <Route path="sensors" element={<SensorList />} />
                  <Route path="sensors/:name" element={<Sensor />} />

                  <Route path="/apps" element={<Navigate to="/apps/explore" replace />} />
                  <Route path="apps" element={<Apps />}>
                    <Route path="explore" element={<AppList />} />
                    <Route path="app/*" element={<App />} />
                    <Route path="my-apps" element={<RequireAuth><AppList /></RequireAuth>} />
                    <Route path="shared-with-me" element={<RequireAuth><AppList /></RequireAuth>} />
                    <Route path="create-app" element={<RequireAuth><CreateApp /></RequireAuth>} />
                  </Route>


                  <Route path="/jobs" element={<Navigate to="/jobs/all-jobs" replace />} />
                  <Route path="jobs" element={<JobStatus />}>
                    <Route path=":view" element={<JobStatus />} />
                  </Route>

                  <Route path="create-job" element={<CreateJob />} />

                  <Route path="data" element={<Data />} />
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

const NodeList = styled.div`
  margin: 0 10px 10px 10px;
`


ReactDom.render(<Sage />, document.getElementById('app'))
