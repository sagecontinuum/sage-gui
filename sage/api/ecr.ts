import config from '../../config'
const url = config.ecr

import testToken from '../../testToken'

const options = {
  headers: {
    Authorization: `sage ${testToken}`
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



export function register(appConfig) {
  return post(`${url}/submit`, appConfig)
}



export function build(app) {
  return post(`${url}/builds/${app}`)
}



export async function registerAndBuild(appConfig, version = '1.0') {
  await register(appConfig)
  const res = await build(`sage/simple/${version}`)
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
}


type App = {
  name: string
  namespace: string
  owner_id: string
}

// special, client-side version of a "repo"
type Repo = App & {
  versions: [{
    id: string,
    name: string,
    namespace: string,
    version: string
  }]
}


type ListAppsParams = {
  includeVersions?: boolean
  includeDetails?: boolean
  includeStatus?: boolean
}

export async function listApps(params: ListAppsParams = {})  {
  const {
    includeVersions = true,
    includeDetails = true,
    includeStatus = true
  } = params

  // first get namespaces
  const nsObjs = await listNamespaces()
  const namespaces = nsObjs.map(o => o.id)
  const objs = await Promise.all(
    namespaces.map(namespace => get(`${url}/apps/${namespace}`))
  )

  // join all repos
  let repos = objs.reduce((acc, obj) => [...acc, ...obj.repositories], [])

  // todo: add api method?
  if (includeVersions) {
    const objs: Repo[] = await Promise.all(
      repos.map(repo => getApp(`${repo.namespace}/${repo.name}`))
    )

    let allApps = []
    for (const repo of objs) {
      const versions = repo.versions
      delete repo.versions

      const apps = versions.map(info => ({...repo, ...info}))
      allApps.push(...apps)
    }
    repos = allApps
  }


  // todo: add api method(s)?
  if (includeDetails) {
    const perms = await Promise.all(
      repos.map(o => listPermissions(`${o.namespace}/${o.name}`))
    )

    const details: any[] = await Promise.all(
      repos.map(o => getApp(`${o.namespace}/${o.name}/${o.version}`))
    )

    // add in permissions and app info
    repos = repos.map((obj, i) => ({
      ...obj,
      permissions: perms[i],
      details: details[i]
    }))
  }


  // todo: add api method?
  if (includeStatus) {
    // implement
  }

  return repos
}


export function getApp(path) : Promise<App> {
  return get(`${url}/apps/${path}`)
}

