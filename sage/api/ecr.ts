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
  return fetch(endpoint, {method: 'POST', body: data, ...options})
    .then(handleErrors)
    .then(res => res.json())
}


export function listApps()  {
  return get(`${url}/apps/sage/simple`)
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