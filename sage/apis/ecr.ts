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


export async function deleteRepo(repo) {
  const {namespace, name} = repo
  const res = await deleteReq(`${url}/repositories/${namespace}/${name}`)
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

export function makePublic(repo: Repo, operation: Operation = 'add') {
  const {namespace, name} = repo
  return put(`${url}/permissions/${namespace}/${name}`, {
    operation,
    granteeType: 'GROUP',
    grantee: 'AllUsers',
    permission: 'READ'
  })
}


export function share(
  repo: Repo,
  grantee: string,
  permission: Permission,
  operation: Operation = 'add'
) {
  const {namespace, name} = repo
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


export async function listApps(onlyPublic = true) {

  const repoPerm = get(`${url}/repositories?view=permissions`)
  const appProm = get(`${url}/apps${onlyPublic ? '?public=true' : ''}`)

  return Promise.all([repoPerm, appProm])
    .then(([repoRes, appRes]) => {

      // API: remove un-owned repos (could be part of api)?  i.e., 'owned=true or 'public=false'?)
      const myRepos = repoRes.data.filter(repo => {
        if (!repo.permissions) return true
        else if (repo.owner_id == Auth.owner_id) return true

        const isPublic = repo.permissions.filter(p => p.grantee === 'AllUsers').length > 0
        return !isPublic
      })

      // create lookup; todo?: could do merging on repos instead
      const repoMap = myRepos.reduce((acc, r) =>
        (`${r.namepsace}/${r.name}` in acc) ?
          acc : {...acc, [`${r.namespace}/${r.name}`]: r}
      , {})


      // sort by last updated
      const allApps =
      appRes.data.sort((a, b) => b.time_last_updated.localeCompare(a.time_last_updated))


      // reduce to last updated (and get versions)
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


      // ignore any apps not in repoMap, and merge in additional data
      apps = apps
        .filter(app => app.id.split(':')[0] in repoMap)
        .map(app => {
          const repo = app.id.split(':')[0]
          const repoInfo = repoMap[repo]
          const permissions = repoInfo.permissions || []
          const isPublic = permissions.filter(p => p.grantee === 'AllUsers').length > 0
          // const isShared = permissions.filter(p => p.grantee !== 'AllUsers').length > 0

          return {
            ...app,
            versions: versions[repo],
            permissions,
            isPublic,
            isShared: false
          }
        })

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

type FullAppConfig = AppConfig & {
  [key: string]: any
}

export function getAppConfig(app: App) : Promise<AppConfig> {
  const {namespace, name, version} = app
  return get(`${url}/apps/${namespace}/${name}/${version}?view=app`)
}

export function getApp(app: App) : Promise<FullAppConfig> {
  const {namespace, name, version} = app
  return get(`${url}/apps/${namespace}/${name}/${version}`)
}





/**
 * the following functions are for testing only
 */

function __deleteEverything() {
  const repoPerm = get(`${url}/repositories?view=permissions`)
  repoPerm.then((res) =>
    res.data.forEach(repo =>
      deleteRepo(repo)
    )
  )
}




