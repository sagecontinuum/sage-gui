import { handleErrors } from '../fetch-utils'
import * as Auth from '../auth/auth'
import config from '/config'

const url = config.deviceRegistration
const __token = Auth.getToken()


const options = {
  headers: __token ? {
    Authorization: `sage ${__token}`
  } : {}
}


export function register() {
  return fetch(url, options)
    .then(handleErrors)
    .then(res => res.blob())


}