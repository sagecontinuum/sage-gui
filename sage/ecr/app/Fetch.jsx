import React, {useState, useReducer} from 'react'
import 'regenerator-runtime/runtime'

import fetch from 'node-fetch'

const initialState = {
  error: null,
  greeting: null,
}

function greetingReducer(state, action) {
  switch (action.type) {
  case 'SUCCESS': {
    return {
      error: null,
      greeting: action.greeting,
    }
  }
  case 'ERROR': {
    return {
      error: action.error,
      greeting: null,
    }
  }
  default: {
    return state
  }
  }
}

export default function Fetch({url}) {
  const [{error, greeting}, dispatch] = useReducer(
    greetingReducer,
    initialState,
  )
  const [buttonClicked, setButtonClicked] = useState(false)

  const fetchGreeting = async url =>
    fetch(url)
      .then(response => {
        const {data} = response
        const {greeting} = data
        dispatch({type: 'SUCCESS', greeting})
        setButtonClicked(true)
      })
      .catch(error => {
        dispatch({type: 'ERROR', error})
      })

  const buttonText = buttonClicked ? 'Ok' : 'Load Greeting'

  return (
    <div>
      <button onClick={() => fetchGreeting(url)} disabled={buttonClicked}>
        {buttonText}
      </button>
      {greeting && <h1>{greeting}</h1>}
      {error && <p role="alert">Oops, failed to fetch!</p>}
    </div>
  )
}