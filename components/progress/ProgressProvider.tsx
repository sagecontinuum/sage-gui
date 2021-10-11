import React from 'react'
import styled from 'styled-components'
import LinearProgress from '@mui/material/LinearProgress'


const ProgressContext = React.createContext(null)


function ProgressProvider(props) {

  const [loading, setLoading] = React.useState(false)

  return (
    <ProgressContext.Provider value={{loading, setLoading}}>
      {loading && <Progress />}

      {props.children}
    </ProgressContext.Provider>
  )
}

const Progress = styled(LinearProgress)`
  position: absolute;
  width: 100%;
  height: 3px;
  left: 0;
  top: 0;
  z-index: 9999;
`


function useProgress() {
  const context = React.useContext(ProgressContext)
  if (context == undefined) {
    throw new Error('useProgress must be used within a ProgressProvider')
  }
  return context
}


export {
  ProgressProvider,
  useProgress
}
