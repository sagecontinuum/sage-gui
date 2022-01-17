import React from 'react'
import ReactDom from 'react-dom'
import {BrowserRouter, Switch, Route, Redirect, NavLink} from 'react-router-dom'
import styled from 'styled-components'

import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import NavBar, {NavItems} from '../components/NavBar'

import DataSearch from './data/DataSearch'
import DataProduct from './data/DataProduct'
import Apps from './ecr/apps/Apps'
import DataBrowser from './data/DataBrowser'
import Ontology from './data/Ontology'

import FilterMenuTest from './fiddle/filter-menu'

import TestSignIn from './sign-in/TestSignIn'
import NotFound from '../components/404'

import { ProgressProvider } from '../components/progress/ProgressProvider'
import { SnackbarProvider } from 'notistack'

import theme from '../components/theme'
import '../assets/styles.scss'



const NavMenu = () =>
  <NavItems>
    <li><NavLink to="/apps">App Catalog</NavLink></li>
    {/*<li><NavLink to="/job-status">Job Status</NavLink></li>*/}
    {/*<li><NavLink to="/data">Data</NavLink></li>*/}
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
          <NavBar Menu={NavMenu} hasSignIn />

          <SnackbarProvider autoHideDuration={3000} preventDuplicate maxSnack={2}>
            <Container>
              <ProgressProvider>
                <Switch>
                  <Redirect exact from="/" to="/apps/explore" />
                  <Redirect exact from="/apps" to="/apps/explore" />

                  <Route path="/apps" component={Apps} />
                  <Route exact path="/data-browser" component={DataBrowser} />
                  <Route path="/data-browser/ontology/:name?" component={Ontology} />
                  <Route exact path="/data" component={DataSearch} />
                  <Route path="/data/product/:name" component={DataProduct} />

                  <Route path="/fiddle/filter-menu" component={FilterMenuTest} />

                  <Route exact path="/login" component={TestSignIn} />
                  <Route path="*" component={NotFound} />
                </Switch>
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
