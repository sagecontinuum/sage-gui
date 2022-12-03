import config from '/config'
const url = config.auth


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

  return res.json().then(error => {
    throw Error(error.detail)
  })
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

export type MyNodes = {
  vsn: string
  access: AccessPerm[]

  // for convenience
  schedule: boolean
  develop: boolean
}

export async function listMyNodes() : Promise<MyNodes> {
  let data = await get(`${url}/users/${user}/access`)

  data = data.map(obj => ({
    ...obj,
    schedule: obj.access.includes('schedule'),
    develop: obj.access.includes('develop')
  }))

  return data
}


