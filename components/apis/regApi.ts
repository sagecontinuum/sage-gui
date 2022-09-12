import * as Auth from '../auth/auth'
import config from '/config'

const url = config.deviceRegistration
const __token = Auth.getToken()


const options = {
  headers: __token ? {
    Authorization: `sage ${__token}`
  } : {}
}

function handleRegErrors(res) {

  if (res.ok) {
    return res
  }

  return res.json().then(errorObj => {
    throw Error(errorObj.message)
  })
}


export function register() {
  return fetch(`${url}/register`, options)
    .then(handleRegErrors)
    .then(res => res.blob())


}