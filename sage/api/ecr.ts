import config from '../../config'
const url = config.ecr

import testToken from '../../testToken'

const options = {
  headers: {
    Authorization: `sage ${testToken}`
  }
}

async function get(endpoint: string) {
  const res = await fetch(endpoint, options)
  const data = await res.json()
  return data
}

function post(endpoint: string, data = '') {
  return fetch(endpoint, {method: 'POST', body: data, ...options})
    .then(res => res.json())
}


export async function listApps()  {
  return await get(`${url}/apps/sage/simple`)
}


function register(appConfig) {
  return post(`${url}/submit`, appConfig)
    .then(data => data.id)
}


export function build(app) {
  return post(`${url}/builds/${app}`)
}


export async function registerAndBuild(appConfig, version = '1.0') {
  await register(appConfig)
  const res = await build(`sage/simple/${version}`)
  return res
}