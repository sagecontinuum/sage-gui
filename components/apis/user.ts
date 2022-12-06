import config from '/config'
const url = config.auth

import { handleErrors } from '../fetch-utils'
import type { VSN } from './beekeeper'

import Auth from '../auth/auth'

const user = Auth.user

const __token = Auth.token

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


type User = {
  username: string
  email: string
  name: string
}

type Profile = {
  organization: string
  department: string
  bio: string
}

export type UserInfo = User & Profile


export function getUserInfo() : Promise<UserInfo> {
  return Promise.all([
    get(`${url}/users/${user}`),
    get(`${url}/user_profile/${user}`)
  ]).then(([user, profile]) => ({...user, ...profile}))
}


export function saveUserInfo(state: Profile) : Promise<Profile> {
  return fetch(`${url}/user_profile/${user}`, {
    'headers': {
      ...options.headers,
      'Content-Type': 'application/json'
    },
    'method': 'PUT',
    'body': JSON.stringify(state),
  }).then(res => res.json())
}


type AccessPerm = 'schedule' | 'develop'

export type MyNode = {
  vsn: VSN
  access: AccessPerm[]

  // for convenience
  schedule: boolean
  develop: boolean
}

export async function listMyNodes() : Promise<MyNode[]> {
  // just return nothing if not actually logged in
  if (!user)
    return []

  // return empty list if request can't be made
  let data
  try {
    data = await get(`${url}/users/${user}/access`)
  } catch (e) {
    return []
  }

  data = data.map(obj => ({
    ...obj,
    schedule: obj.access.includes('schedule'),
    develop: obj.access.includes('develop')
  }))

  return data
}


export async function listHasPerm(perm: AccessPerm) : Promise<VSN[]> {
  const nodes = await listMyNodes()
  return nodes
    .filter(obj => obj[perm])
    .map(obj => obj.vsn)
}


