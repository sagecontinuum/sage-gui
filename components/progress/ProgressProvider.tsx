import React from 'react'
import LinearProgress from '@material-ui/core/LinearProgress'


const ProgressContext = React.createContext(null)


function ProgressProvider(props) {

  const [loading, setLoading] = React.useState(false)

  return (
    <ProgressContext.Provider value={{loading, setLoading}}>
      {loading &&
        <LinearProgress style={{position: 'absolute', width: '100%', height: '3px', left: 0, top: 60}} />
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
