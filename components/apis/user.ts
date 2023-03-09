import config from '/config'
const url = config.auth

// import { handleErrors } from '../fetch-utils'
import type { VSN } from './beekeeper'

import Auth from '../auth/auth'

const user = Auth.user

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

  return res.json().then(errorObj => {
    // todo(nc): suggest a generic error handling on api
    throw Error(errorObj.ssh_public_keys)
  })
}


function get(endpoint: string) {
  return fetch(endpoint, options)
    .then(handleErrors)
    .then(res => res.json())
}


function put(endpoint: string, data) {
  const putOptions = {
    'headers': {
      ...options.headers,
      'Content-Type': 'application/json'
    },
    'method': 'PUT',
    'body': JSON.stringify(data)
  }

  return fetch(endpoint, putOptions)
    .then(handleErrors)
    .then(res => res.json())
}



type User = {
  username: string
  email: string
  name: string
  is_staff: boolean
  is_approved: boolean
}

type Profile = {
  organization: string
  department: string
  bio: string
  ssh_public_keys: string
}

export type UserInfo = User & Profile


export function getUserDetails() : Promise<User> {
  return get(`${url}/users/${user}`)
}


export function getUserInfo() : Promise<UserInfo> {
  return Promise.all([
    getUserDetails(),
    get(`${url}/user_profile/${user}`)
  ]).then(([user, profile]) => ({...user, ...profile}))
}


export function saveUserInfo(state: Profile) : Promise<Profile> {
  return put(`${url}/user_profile/${user}`, state)
}


export function saveSSHKey(state: {ssh_public_keys: Profile['ssh_public_keys']}) : Promise<Profile> {
  return put(`${url}/user_profile/${user}`, state)
}


export type AccessPerm = 'schedule' | 'develop'

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


export async function listNodesWithPerm(perm: AccessPerm) : Promise<VSN[]> {
  const nodes = await listMyNodes()
  return nodes
    .filter(obj => obj[perm])
    .map(obj => obj.vsn)
}


export async function hasCapability(perm: AccessPerm | AccessPerm[]) : Promise<boolean> {
  const perms = Array.isArray(perm) ? perm : [perm]

  const nodes = await listMyNodes()
  const nodesWithSomePerm = perms.flatMap(perm =>
    nodes.filter(obj => obj[perm])
      .map(obj => obj.vsn)
  )

  return nodesWithSomePerm.length > 0
}


