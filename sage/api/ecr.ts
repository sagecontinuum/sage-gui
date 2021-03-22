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



export function listPermissions(app: string) {
  return get(`${url}/permissions/${app}`)
}



type Repo = {
  name: string
  namespace: string
  owner_id: string
  versions: [{
    id: string,
    name: string,
    namespace: string,
    version: string
  }]
}

type Permission = {
  grantee: string
  granteeType: 'USER' | 'GROUP'
  permission: 'READ' | 'WRITE' | 'READ_ACP' | 'WRITE_ACP' | 'FULL_CONTROL'
  resourceName: string
  resourceType: 'string'
}

type ListAllProps = {
  namespace: string
  includeVersions?: boolean
  includePermissions?: boolean
}

export async function listAll(params: ListAllProps)  {
  const {
    namespace,
    includeVersions = true,
    includePermissions = true
  } = params

  if (!namespace)
    throw Error('listApps: must provide a namespace (for now)')

  const obj = await get(`${url}/apps/${namespace}`)
  let repos = obj.repositories
  const names = repos.map(repo => repo.name)


  // todo: add api method?
  if (includeVersions) {
    const objs: Repo[] = await Promise.all(
      names.map(name => getApp(`${namespace}/${name}`))
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

  // todo: add api method?
  if (includePermissions) {
    const perms: Permission[][] = await Promise.all(
      repos.map(o => listPermissions(`${o.namespace}/${o.name}`))
    )

    // add in permissions
    repos = repos.map((obj, i) => ({...obj, permissions: perms[i]}))
  }

  return repos
}



export function getApp(path) {
  return get(`${url}/apps/${path}`)
}

