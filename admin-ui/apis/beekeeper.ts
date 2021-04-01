import config from '../../config'
const url = config.beekeeper


const IGNORE_IDS = [
  '0000000000000001',
  '000048B02D05A0A4',
  '000048B02D07627C',
  '000048B02D0766D2'
]

function handleErrors(res) {
  if (res.ok) {
    return res
  }

  return res.json().then(errorObj => {
    throw Error(errorObj.error)
  })
}


function get(endpoint: string) {
  return fetch(endpoint)
    .then(handleErrors)
    .then(res => res.json())
}


function post(endpoint: string, body = '') {
  return fetch(endpoint, {
    method: 'POST',
    body
  }).then(handleErrors)
}


export async function fetchStatus() {
  const data = await get(`${url}/state`)
  return data.data
    .filter(o => !IGNORE_IDS.includes(o.id))
    .map(obj => ({
      ...obj,
      status: 'loading'
    }))
}
