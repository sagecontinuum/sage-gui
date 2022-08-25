import ReactDom from 'react-dom'
import {BrowserRouter, Routes, Route, Navigate, NavLink} from 'react-router-dom'
import styled from 'styled-components'

import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'
import theme from '/components/theme'
import CssBaseline from '@mui/material/CssBaseline'

import NavBar, {NavItems} from '/components/NavBar'

import AppList from './ecr/apps/AppList'
import App from './ecr/app/App'
import CreateApp from './ecr/create-app/CreateApp'
import RequireAuth from '/components/auth/RequireAuth'

import Apps from './ecr/apps/Apps'
import Node from '../common/node/Node'
import JobStatus from './jobs/JobStatus'
import CreateJob from './jobs/create-job/CreateJob'
import DataBrowser from './data-stream/DataBrowser'
import Ontology from './data-commons/Ontology'
import Data from './data/Data'
import DataProductSearch from './data-commons/DataProductSearch'
import DataProduct from './data-commons/DataProduct'
import NanoList from './account/NanoList'


import TestSignIn from './sign-in/TestSignIn'
import NotFound from '/components/404'

import { ProgressProvider } from '/components/progress/ProgressProvider'
import { SnackbarProvider } from 'notistack'

import '/assets/styles.scss'



const NavMenu = () =>
  <NavItems>
    <li><NavLink to="/apps/explore">App Catalog</NavLink></li>
    {/*<li><NavLink to="/job-status">Job Status</NavLink></li>*/}
    <li><NavLink to="/data">Data</NavLink></li>
  </NavItems>


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
                  <Route path="/" element={<Navigate to="apps/explore" replace />} />
                  <Route path="/apps" element={<Navigate to="/apps/explore" replace />} />

                  <Route path="apps" element={<Apps />}>
                    <Route path="explore" element={<AppList />} />
                    <Route path="app/*" element={<App />} />
                    <Route path="my-apps" element={<RequireAuth><AppList /></RequireAuth>} />
                    <Route path="shared-with-me" element={<RequireAuth><AppList /></RequireAuth>} />
                    <Route path="create-app" element={<RequireAuth><CreateApp /></RequireAuth>} />
                  </Route>

                  <Route path="job-status" element={<JobStatus />} />
                  <Route path="create-job" element={<CreateJob />} />

                  <Route path="data" element={<Data />} />
                  <Route path="data/ontology/:name" element={<Ontology />} />
                  <Route path="data/product/:name" element={<DataProduct />} />
                  <Route path="data-browser" element={<DataBrowser />} />

                  <Route path="data-commons-demo" element={<DataProductSearch />} />

                  <Route path="node/:node" element={<Node />} />

                  <Route path="my-devices" element={<RequireAuth><NanoList /></RequireAuth>} />

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



ReactDom.render(<Sage />, document.getElementById('app'))
