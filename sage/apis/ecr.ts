import config from '../../config'
const url = config.ecr

import * as Auth from '../../components/auth/auth'



const options = {
  headers: {
    Authorization: `sage ${Auth.token}`
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



function get(endpoint: string) {
  return fetch(endpoint, options)
    .then(handleErrors)
    .then(res => res.json())
}

function post(endpoint: string, data = '') {
  return fetch(endpoint, {
    method: 'POST',
    body: data,
    ...options
  }).then(handleErrors)
    .then(res => res.json())
}

function put(endpoint: string, data = {}) {
  return fetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options
  }).then(handleErrors)
    .then(res => res.json())
}

function deleteReq(endpoint: string) {
  return fetch(endpoint, {
    method: 'DELETE',
    ...options
  }).then(handleErrors)
    .then(res => res.json())
}


export type Repo = {
  namespace: string
  name: string
}

export type App = {
  namespace: string,
  name: string
  version: string
}


export function register(appConfig) {
  return post(`${url}/submit`, appConfig)
}



export function build(app: App) {
  const {namespace, name, version} = app
  return post(`${url}/builds/${namespace}/${name}/${version}`)
}



export async function registerAndBuild(app: App, appConfig) {
  await register(appConfig)
  const res = await build(app)
  return res
}


export async function deleteApp(app: App) {
  const {namespace, name, version} = app
  const res = await deleteReq(`${url}/apps/${namespace}/${name}/${version}`)
  return res
}

type Operation = 'add' | 'delete'
type GranteeType = 'USER' | 'GROUP'
type Permission =  'READ' | 'WRITE' | 'READ_ACP' | 'WRITE_ACP' | 'FULL_CONTROL'
type PermissionObj = {
  grantee: string
  granteeType: GranteeType
  permission: Permission
  resourceName: string
  resourceType: 'string'
}

export function makePublic(repoObj: Repo, operation: Operation = 'add') {
  const {namespace, name} = repoObj
  return put(`${url}/permissions/${namespace}/${name}`, {
    operation,
    granteeType: 'GROUP',
    grantee: 'AllUsers',
    permission: 'READ'
  })
}


export function share(
  repoObj: Repo,
  grantee: string,
  permission: Permission,
  operation: Operation = 'add'
) {
  const {namespace, name} = repoObj
  return put(`${url}/permissions/${namespace}/${name}`, {
    operation,
    granteeType: 'USER',
    grantee,
    permission
  })
}

export function listPermissions(app: string) : Promise<PermissionObj[][]> {
  return get(`${url}/permissions/${app}`)
}



type Namespace = {
  id: string
  owner_id: string
  type: string
}

export function listNamespaces() : Promise<Namespace[]>{
  return get(`${url}/apps`)
    .then(data => data.data)
}


export async function listApps(onlyPublic = false) {
  return get(`${url}/apps${onlyPublic ? '?public=true' : ''}`)
    .then(data => {
      const allApps = data.data.sort((a, b) => b.time_last_updated.localeCompare(a.time_last_updated))

      // reduce to latest (and get versions)
      let versions = {}
      let apps = allApps.reduce((acc, app) => {
        const [repo, ver] = app.id.split(':')

        if (repo in versions) {
          versions[repo].push(ver)
          return acc
        } else {
          versions[repo] = [ver]
          return [...acc, app]
        }
      }, [])

      // merge in versions
      apps = apps.map(app => ({
        ...app,
        versions: versions[app.id.split(':')[0]]
      }))

      return apps
    })
}



export type AppConfig = {
  name: string
  description: string
  version: string
  namespace: string
  source: {
    architectures: string[]
  }
  url: string
  directory: string
  resources: {type: string, view: string, min_resolution: string}[]
  inputs: {id: string, type: string}[]
  metadata: {
    [item: string]: any
  }
}


type AppDef = {
  name: string
  namespace: string
  owner_id: string
}

export function getApp(
  namespace: string,
  name: string,
  version?: string
) : Promise<AppConfig | AppDef> {

  if (version)
    return get(`${url}/apps/${namespace}/${name}/${version}`)
  else
    return get(`${url}/apps/${namespace}/${name}`)
}


export function getAppConfig(
  namespace: string,
  name: string,
  version?: string) : Promise<AppConfig> {

  return get(`${url}/apps/${namespace}/${name}/${version}?view=app`)
}

