import config from '../../config'
export const url = config.auth
export const docs = config.docs

import { handleErrors } from '../fetch-utils'

import * as Auth from '../auth/auth'
const username = Auth.username

const __token = Auth.getToken()

const options = {
  headers: __token ? {
    Authorization: `sage ${__token}`
  } : {}
}



function get(endpoint: string) {
  return fetch(endpoint, options)
    .then(handleErrors)
    .then(res => res.json())
}



export type Info = {
  organization: string
  department: string
  bio: string
}

export function getUserInfo() : Promise<Info> {
  return get(`${url}/user_profile/${username}`)
    .then(data => data.data[0])
}


export function saveUserInfo(state: Info) : Promise<Info> {
  return fetch(`${url}/user_profile/${username}`, {
    'headers': {
      ...options.headers,
      'Content-Type': 'application/json'
    },
    'method': 'POST',
    'body': JSON.stringify(state),
  }).then(res => res.json())
    .then(data => data[0])
}