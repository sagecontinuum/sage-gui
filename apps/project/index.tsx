import ReactDom from 'react-dom'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import styled from 'styled-components'

import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import NavBar, { NavItems, NavItem } from '/components/nav-bar/NavBar'
import Node from '/components/views/node/Node'
import Nodes from '/components/views/nodes/Nodes'
import Sensor from '/components/views/sensor/Sensor'
import SensorList from '/components/views/sensor/SensorList'

import Data from '/apps/sage/data/Data'
import DataBrowser from '/apps/sage/data-stream/DataBrowser'
import Ontology from '/apps/sage/data-commons/Ontology'
import DataProduct from '/apps/sage/data-commons/DataProduct'

import NotFound from '/components/404'
import { ProgressProvider } from '/components/progress/ProgressProvider'

import theme from '/components/theme'
import '/assets/styles.scss'
import settings from './settings'


const NavMenu = () =>
  <NavItems>
    <NavItem label="Nodes" to="nodes" />
    <NavItem label="Data" to="data" />
  </NavItems>


const LogoPlaceHolder = () =>
  <Logo>{settings.logo || settings.project || settings.focus}</Logo>



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
          />

          <Container>
            <ProgressProvider>
              <Routes>
                <Route path="/" element={<Navigate to="nodes" replace />} />

                <Route path="nodes" element={<Nodes/>} />
                <Route path="node/:vsn" element={<Node />} />
                <Route path="sensors" element={<SensorList project={settings.project} focus={settings.focus} />} />
                <Route path="sensors/:name" element={<Sensor />} />


                <Route path="data" element={<Data project={settings.project} focus={settings.focus} />} />
                <Route path="data/ontology/:name" element={<Ontology />} />
                <Route path="data/product/:name" element={<DataProduct />} />
                <Route path="query-browser" element={<DataBrowser />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </ProgressProvider>
          </Container>
        </BrowserRouter>
      </ThemeProvider>
    </StyledEngineProvider>
  )
}

const Container = styled.div`
  margin: 60px 10px 10px 10px;
  width: 100%;
`

const Logo = styled.span`
  font-size: 2.2em;
  font-family: 'Open sans', sans-serif;
  font-weight: 800;
  color: #666;
  margin-bottom: 2px;
  padding-right: 20px;
  padding-left: 2px;

  sup {
    position: relative;
    top: -5px;
    font-size: .3em;
    color: #aaa;
  }
`

ReactDom.render(<App />, document.getElementById('app'))
