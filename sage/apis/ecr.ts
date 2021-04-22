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


function deleteReq(endpoint: string) {
  return fetch(endpoint, {
    method: 'Delete',
    ...options
  }).then(handleErrors)
    .then(res => res.json())
}


type AppDef = {
  namespace: string
  name: string
  version: string
}


export function register(appConfig) {
  return post(`${url}/submit`, appConfig)
}



export function build(app: AppDef) {
  const {namespace, name, version} = app
  return post(`${url}/builds/${namespace}/${name}/${version}`)
}



export async function registerAndBuild(app: AppDef, appConfig) {
  await register(appConfig)
  const res = await build(app)
  return res
}


export async function deleteApp(app: AppDef) {
  const {namespace, name, version} = app
  const res = await deleteReq(`${url}/apps/${namespace}/${name}/${version}`)
  return res
}


type Permission = {
  grantee: string
  granteeType: 'USER' | 'GROUP'
  permission: 'READ' | 'WRITE' | 'READ_ACP' | 'WRITE_ACP' | 'FULL_CONTROL'
  resourceName: string
  resourceType: 'string'
}

export function listPermissions(app: string) : Promise<Permission[][]> {
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



type App = {
  name: string
  namespace: string
  owner_id: string
}

// special, client-side version of a "repo"
type Repo = App & {
  versions?: [{
    id: string,
    name: string,
    namespace: string,
    version: string
  }]
}

type ListAppsParams = {
  includeStatus?: boolean
}

export async function listApps(params: ListAppsParams = {})  {
  return get(`${url}/apps`)
    .then(data => data.data)
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


export function getApp(namespace: string, name: string, version?: string) : Promise<App> {
  if (version)
    return get(`${url}/apps/${namespace}/${name}/${version}`)
  else
    return get(`${url}/apps/${namespace}/${name}`)
}