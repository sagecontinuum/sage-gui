import React from 'react'
import ReactDom from 'react-dom'

import NavBar from '../components/NavBar'
import Overview from './views/Overview'

import './assets/styles.scss'


function App() {



  return (
    <div>
      <NavBar />


      <Overview />
    </div>

  )
}






ReactDom.render(<App />, document.getElementById('app'))