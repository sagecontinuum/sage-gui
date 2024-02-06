import ReactDom from 'react-dom'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import styled from 'styled-components'

import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import MetaRoute from '/components/Meta'
import NavBar, { NavItems, NavItem } from '/components/nav-bar/NavBar'
import NodeTabs from '/components/views/nodes/NodeTabs'
import Nodes from '/components/views/nodes/Nodes'
import Node from '/components/views/node/Node'
import Sensor from '/components/views/sensor/Sensor'
import SensorList from '/components/views/sensor/SensorList'

import Data from '/apps/sage/data/Data'
import QueryBrowser from '../sage/data-stream/QueryBrowser'
import Ontology from '/apps/sage/data-commons/Ontology'
import DataProduct from '/apps/sage/data-commons/DataProduct'

import TestSignIn from '/components/TestSignIn'
import NotFound from '/components/404'

import { ProgressProvider } from '/components/progress/ProgressProvider'

import '/assets/styles.scss'

import theme from '/components/theme'
import settings from '/components/settings'

const {logo, alt, url, project, focus, nodes} = settings


const NavMenu = () =>
  <NavItems>
    <NavItem label="Nodes" to="nodes" />
    <NavItem label="Data" to="data" />
  </NavItems>


const LogoPlaceHolder = () => {
  return (
    <>
      {logo ?
        <a href={url} target="_blank" rel="noreferrer" className="no-style">
          <LogoImg src={logo} alt={alt} />
        </a> :
        <LogoText>
          <Link to="/" className="no-style">
            {project || focus}
          </Link>
        </LogoText>
      }
    </>
  )
}


const LogoImg = styled.img`
  height: 60px;
  margin-right: 20px;
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
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <CssBaseline/>
          <NavBar
            logo={<LogoPlaceHolder/>}
            menu={<NavMenu />}
            hasDocsLink
            hasSignIn
          />

          <Container>
            <ProgressProvider>
              <Routes>
                <Route path="/" element={<Navigate to="nodes" replace />} />

                <Route path='/' element={<MetaRoute />}>
                  <Route path="/" element={<NodeTabs />}>
                    <Route path="nodes" element={<Nodes />} />
                    <Route path="sensors" element={<SensorList {...{project, focus, nodes}} />} />
                  </Route>

                  <Route path="node/:vsn" element={<Node />} />
                  <Route path="sensors/:name" element={<Sensor />} />

                  <Route path="data" element={<Data {...{project, focus, nodes}} />} />
                  <Route path="data/ontology/:name" element={<Ontology />} />
                  <Route path="data/product/:name" element={<DataProduct />} />
                  <Route path="query-browser" element={<QueryBrowser />} />

                  <Route path="login" element={<TestSignIn />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </ProgressProvider>
          </Container>
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
