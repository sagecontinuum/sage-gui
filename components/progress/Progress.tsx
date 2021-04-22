import React from 'react'
import LinearProgress from '@material-ui/core/LinearProgress'


const ProgressContext = React.createContext({})


function ProgressProvider(props) {

  const [isLoading, setIsLoading] = React.useState(false)

  return (
    <ProgressContext.Provider value={[isLoading, setIsLoading]}>
      {isLoading &&
        <LinearProgress style={{position: 'absolute', width: '100%'}} />
      }

      {props.children}
    </ProgressContext.Provider>
  )
}


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
