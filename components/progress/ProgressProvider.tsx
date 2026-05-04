import React, { ReactNode } from 'react'
import styled from 'styled-components'
import LinearProgress from '@mui/material/LinearProgress'


interface ProgressContextType {
  loading: boolean
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
}

const ProgressContext = React.createContext<ProgressContextType | null>(null)


function ProgressProvider(props: { children: ReactNode }) {

  const [loading, setLoading] = React.useState(false)

  return (
    <ProgressContext.Provider value={{loading, setLoading}}>
      {loading && <Progress />}

      {props.children}
    </ProgressContext.Provider>
  )
}

const Progress = styled(LinearProgress)`
  position: fixed;
  width: 100%;
  height: 3px;
  left: 0;
  top: 0;
  z-index: 9999;
`


function useProgress() {
  const context = React.useContext(ProgressContext)
  if (context == null) {
    throw new Error('useProgress must be used within a ProgressProvider')
  }
  return context
}


export {
  ProgressProvider,
  useProgress
}
