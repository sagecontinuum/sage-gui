import config from '../../config'
import { NodeStatus } from '../node'

const url = config.beekeeper


export type State = {
  address: string
  altitude: number
  beehive: string
  id: string
  internet_connection: string
  mode: string
  name: string
  position: string // will be point()?
  project_id: null
  registration_event: string // todo: fix format
  server_node: string
  timestamp: string // todo: fix format ("Sun, 14 Mar 2021 16:58:57 GMT")

  // additional status field.  may be replaced with 'mode' or such
  status: NodeStatus
}



function handleErrors(res) {
  if (res.ok) {
    return res
  }

  // todo(nc): verify
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


export async function fetchState() : Promise<State[]> {
  const data = await get(`${url}/state`)

  return data.data
    .map(obj => ({
      ...obj,
      status: 'loading',
      registration_event: new Date(obj.registration_event).getTime()
    }))
}

export async function fetchNode(id: string) : Promise<State[]> {
  const data = await get(`${url}/state/${id}`)
  return data.data
}