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
  repo: string
}

export type App = {
  namespace: string,
  repo: string
  version: string
}


export function register(appConfig) {
  return post(`${url}/submit`, appConfig)
}



export function build(app: App) {
  const {namespace, repo, version} = app
  return post(`${url}/builds/${namespace}/${repo}/${version}`)
}



export async function registerAndBuild(app: App, appConfig) {
  await register(appConfig)
  const res = await build(app)
  return res
}


export async function deleteApp(app: App) {
  const {namespace, repo, version} = app
  const res = await deleteReq(`${url}/apps/${namespace}/${repo}/${version}`)
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

export function makePublic(repoObj : Repo, operation = 'add') {
  const {namespace, repo} = repoObj
  return put(`${url}/permissions/${namespace}/${repo}`, {
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
  const {namespace, repo} = repoObj
  return put(`${url}/permissions/${namespace}/${repo}`, {
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


export async function listApps()  {
  return get(`${url}/apps`)
    .then(data => {
      const allApps = data.data.sort((a, b) => b.time_last_updated.localeCompare(a.time_last_updated))

      // reduce to latest
      const repos = []
      const apps = allApps.reduce((acc, app) => {
        const path = app.id.split(':')[0]
        if (repos.includes(path)) {
          return acc
        } else {
          repos.push(path)
          return [...acc, app]
        }
      }, [])

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






/*************/

// DEPRECATED: special, client-side version of a "repo"
/*
type Repo = AppDef & {
  versions?: [{
    id: string,
    name: string,
    namespace: string,
    version: string
  }]
}*/

type ListAppsParams = {
  includeStatus?: boolean
}

export async function listAppsDeprecated(params: ListAppsParams = {})  {
  const {
    includeStatus = true
  } = params

  // first get namespaces
  const nsObjs = await listNamespaces()

  const namespaces = nsObjs.map(o => o.id)
  const objs = await Promise.all(
    namespaces.map(namespace => get(`${url}/apps/${namespace}`))
  )


  // join all repos
  let repos: Repo[] = objs.reduce((acc, obj) => [...acc, ...obj.repositories], [])

  // include versions
  repos = await Promise.all(
    repos.map(o => getApp(o.namespace, o.name))
  )

  // sort versions
  repos = repos.map(obj => ({
    ...obj,
    versions: obj.versions.sort((a, b) => b.version.localeCompare(a.version))
  }))

  // get permissions
  const perms = await Promise.all(
    repos.map(o => listPermissions(`${o.namespace}/${o.name}`))
  )

  // get app info
  const details: any[] = await Promise.all(
    repos.map(o => o.versions.length ?
      getApp(o.namespace, o.name, o.versions[0].version) : {}
    )
  )

  // merge in all the of the above
  repos = repos.map((obj, i) => ({
    ...obj,
    permissions: perms[i],
    details: details[i],
    version: obj.versions.length ? obj.versions[0].version : null,
    id: details[i].id || `id-${i}`
  }))


  // todo: add api method?
  if (includeStatus) {
    // implement
  }

  return repos
}
