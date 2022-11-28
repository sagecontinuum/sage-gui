import config from '../../config'
export const url = config.auth
export const docs = config.docs

import Auth from '../auth/auth'
const username = Auth.user

const __token = Auth.token

const options = {
  headers: __token ? {
    Authorization: `sage ${__token}`
  } : {}
}


function handleErrors(res) {
  if (res.ok) {
    return res
  }

  return res.json().then(error => {
    throw Error(error.detail)
  })
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
}


export function saveUserInfo(state: Info) : Promise<Info> {
  return fetch(`${url}/user_profile/${username}`, {
    'headers': {
      ...options.headers,
      'Content-Type': 'application/json'
    },
    'method': 'PUT',
    'body': JSON.stringify(state),
  }).then(res => res.json())
}