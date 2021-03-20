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

type ListAllProps = {
  namespace: string
  includeVersions?: boolean
}

export async function listAll(params: ListAllProps)  {
  const {namespace, includeVersions = true} = params

  if (!namespace)
    throw Error('listApps: must provide a namespace (for now)')

  const obj = await get(`${url}/apps/${namespace}`)

  // todo: check performance/scalability
  if (includeVersions) {
    const repos = obj.repositories
    const names = repos.map(repo => repo.name)

    const objs: Repo[] = await Promise.all(
      names.map(name => get(`${url}/apps/${namespace}/${name}`))
    )

    let allApps = []
    for (const repo of objs) {
      const versions = repo.versions
      delete repo.versions

      const apps = versions.map(info => ({...repo, ...info}))
      allApps.push(...apps)
    }
    return allApps
  }

  return obj
}



export function getApp(path) {
  return get(`${url}/apps/${path}`)
}

