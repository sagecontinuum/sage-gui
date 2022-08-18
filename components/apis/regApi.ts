import { handleErrors } from '../fetch-utils'

import * as Auth from '../auth/auth'

const __token = Auth.getToken()

const options = {
  headers: __token ? {
    Authorization: `sage ${__token}`
  } : {}
}



export function register(endpoint: string) {
  return fetch(endpoint, options)
    .then(handleErrors)
    .then(res => res.blob())


}