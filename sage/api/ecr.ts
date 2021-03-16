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

export async function listApps()  {
  return await get(`${url}/apps/sage/simple`)
}

