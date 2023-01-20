/**
 * Example component that we'll test against.
 * See `./__tests__/sample.test.jsx` for test code
 *
 * This example largely based on:
 *  https://testing-library.com/docs/react-testing-library/example-intro
 *
 * Compared to the example above, we make node-fetch available globally
 * to support server-side data fetching.  See ./jest.setup.js global config.
 *
 * NOTE: THIS EXAMPLE IS IGNORED IN ./jest.setup.js > "testPathIgnorePatterns"
 *
 */

import {useState, useReducer} from 'react'


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


function handleErrors(res) {
  if (res.ok) {
    return res
  }

  return res.json().then(errorObj => {
    throw Error(errorObj.error)
  })
}


export default function Fetch({url}) {
  const [{error, greeting}, dispatch] = useReducer(
    greetingReducer,
    initialState,
  )
  const [buttonClicked, setButtonClicked] = useState(false)

  const fetchGreeting = url => {
    fetch(url)
      .then(handleErrors)
      .then(res => res.json())
      .then(data => {
        const {greeting} = data
        dispatch({type: 'SUCCESS', greeting})
        setButtonClicked(true)
      })
      .catch((error) => {
        dispatch({type: 'ERROR', error})
      })
  }

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