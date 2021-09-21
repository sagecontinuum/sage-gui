import config from '../../config'
import { NodeStatus } from '../node'

// currently static data
import nodeMeta from '../data/node-meta.json'
import geo from '../data/geo.json'


const url = config.beekeeper

const IGNORE_LIST = config.admin.ignoreList


export type State = {
  address: string
  altitude: number
  beehive: string
  id: string
  internet_connection: string
  mode: string
  name: string
  position: string    // will be point()?
  project_id: null
  registration_event: string // todo: fix format
  server_node: string
  timestamp: string   // todo: fix format ("Sun, 14 Mar 2021 16:58:57 GMT")

  /* new, proposed fields. */
  status: NodeStatus  // may be replaced with 'mode' or such?
  project: string
  location: string    // currently part of "project" in mock data
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
    .filter(obj => !IGNORE_LIST.includes(obj.id))
    .map(obj => {
      const meta = nodeMeta[obj.id],
        proj = meta?.Project || '-'

      const parts = (proj || '').split(',').map(p => p.trim())
      const [project, location = '-'] = parts

      const position = geo[obj.id]

      return {
        ...obj,
        project,
        location,
        status: 'inactive',
        // position: geo[obj.id],
        lat: position ? position[0] : null,
        lng: position ? position[1] : null,
        registration_event: new Date(obj.registration_event).getTime()
      }
    })
}

export async function fetchNode(id: string) : Promise<State[]> {
  const data = await get(`${url}/state/${id}`)
  return data.data
}