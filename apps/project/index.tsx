import { useEffect, useState } from 'react'
import ReactDom from 'react-dom'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import styled from 'styled-components'

import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

/* todo
import { lazy, Suspense } from 'react'
import JobsIcon from '@mui/icons-material/ListRounded'
import MyJobsIcon from '@mui/icons-material/Engineering'
import AddIcon from '@mui/icons-material/AddRounded'
*/

import MetaRoute from '/components/Meta'
import NavBar, { NavItems } from '/components/nav-bar/NavBar'
import NavItem from '/components/nav-bar/NavItem'
// import Progress from '/components/progress/LazyLoading'

import NodeTabs from '/components/views/nodes/NodeTabs'
import Nodes from '/components/views/nodes/Nodes'
import Node from '/components/views/node/Node'
import Sensor from '/components/views/sensor/Sensor'
import SensorList from '/components/views/sensor/SensorList'
// import JobStatus from '../sage/jobs/JobStatus'
// const CreateJob = lazy(() => import('../sage/jobs/create-job/CreateJob'))

import Data from '/apps/sage/data/Data'
import QueryBrowser from '../sage/data-stream/QueryBrowser'
import Ontology from '/apps/sage/data-commons/Ontology'
import DataProduct from '/apps/sage/data-commons/DataProduct'

import Account from '/components/account/Account'
import UserProfile from '/components/account/UserProfile'
import MyNodes from '/components/account/MyNodes'
import Devices from '/components/account/Devices'
import DevAccess from '/components/account/DevAccess'

import RequireAuth from '/components/auth/RequireAuth'
import TestSignIn from '/components/TestSignIn'
import NotFound from '/components/404'

import { PermissionProvider } from '/components/auth/PermissionProvider'
import { ProgressProvider } from '/components/progress/ProgressProvider'
import { SnackbarProvider } from 'notistack'

import theme from '/components/theme'
import '/assets/styles.scss'

import settings from '/components/settings'
import { Alert } from '@mui/material'
import config, { Notice } from '/config'


const {Logo, url, project, vsns} = settings


const NavMenu = () =>
  <NavItems>
    <NavItem label="Nodes" to="nodes" />
    <NavItem label="Data" to="data" />
    {/* <NavItem label="Job Status" to="jobs" /> */}
  </NavItems>


const LogoPlaceHolder = () => {
  return (
    <>
      {Logo ?
        <LogoContainer href={url} target="_blank" rel="noreferrer" className="no-style">
          {/* @ts-ignore: call signature issue */}
          <Logo />
        </LogoContainer> :
        <LogoText>
          <Link to="/" className="no-style">
            {project || focus}
          </Link>
        </LogoText>
      }
    </>
  )
}


const LogoContainer = styled.a`
  width: 200px;
  margin: 5px 20px 0 -5px;
`

const LogoText = styled.span`
  font-size: 2.2em;
  font-family: 'Open sans', sans-serif;
  font-weight: 800;
  color: #666;
  margin-bottom: 2px;
  padding-right: 20px;
  padding-left: 2px;

  a:hover {
    opacity: .85;
  }
`


export default function App() {

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
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <CssBaseline/>
          <NavBar
            logo={<LogoPlaceHolder />}
            menu={<NavMenu />}
            hasDocsLink
            hasSignIn
          />

          <PermissionProvider>
            <SnackbarProvider autoHideDuration={3000} preventDuplicate maxSnack={2}>
              <Container>
                {notice &&
                  <Alert severity={notice?.severity || 'info'} onClose={() => setNotice(null)}>
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
                        <Route path="sensors" element={<SensorList {...{project, vsns}} />} />
                      </Route>

                      <Route path="node/:vsn" element={<Node />} />
                      <Route path="sensors/:name" element={<Sensor />} />

                      {/*
                      <Route path="/jobs" element={<Navigate to="/jobs/all-jobs" replace />} />
                      <Route path="jobs" element={<JobStatus />}>
                        <Route path=":view" element={<JobStatus />} />
                      </Route>

                      <Route path="create-job" element={
                        <Suspense fallback={<Progress/>}><CreateJob/></Suspense>
                      }/>
                      */}

                      <Route path="data" element={<Data {...{project, vsns}}  />} />
                      <Route path="data/ontology/:name" element={<Ontology />} />
                      <Route path="data/product/:name" element={<DataProduct />} />
                      <Route path="query-browser" element={<QueryBrowser />} />

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


ReactDom.render(<App />, document.getElementById('app'))
