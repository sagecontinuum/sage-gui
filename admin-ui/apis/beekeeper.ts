import config from '../../config'
import { NodeStatus } from '../node'

// currently static data
import geo from '../data/geo.json'

import tokens from '../../tokens'

const url = config.beekeeper



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

  /* new, proposed fields? */
  status: NodeStatus  // may be replaced with 'mode' or such?
  project: string
  location: string    // currently part of "project" in mock data
  isOnline: boolean
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


async function fetchMonitorData() {
  const data = await get(`https://sheets.googleapis.com/v4/spreadsheets/1ZuwMfmGvHgRLAaoJBlBNJ3MO7FuqmkV__4MFinNm8Fk/values/main!A2:B100?key=${process.env.GOOGLE_TOKEN || tokens.google}`)
  return data.values.reduce((acc, [id, expectedState]) => ({...acc, [id]: {expectedState}}), {})
}


async function fetchProjectMeta() {
  const data = await get(`https://sheets.googleapis.com/v4/spreadsheets/1S9v6RD0laPeTvC8wKO-NaLmKXbBoc8vdxFihBf8Ao50/values/overall!A2:H1000?key=${process.env.GOOGLE_TOKEN || tokens.google}`)
  return data.values.reduce((acc, [kind, id, , project, location]) =>
    ({...acc, [id]: {kind, project, location}})
  , {})
}


export async function fetchState() : Promise<State[]> {
  let monitorMeta, includeList
  try {
    monitorMeta = await fetchMonitorData()
    includeList = Object.keys(monitorMeta)
  } catch(e) {
    // todo(nc): maybe give a warning to user?
    // unreachable case is handled below
  }

  let meta
  try {
    meta = await fetchProjectMeta()
  } catch(e) {
    // todo(nc): maybe give a warning to user?
    // unreachable case is handled below
  }

  const data = await get(`${url}/state`)

  return data.data
    .filter(obj => monitorMeta ? includeList.includes(obj.id) : true)
    .map(obj => {
      const {id} = obj

      const position = geo[id]

      const metaIsAvail = meta && id in meta
      const monIsAvail = monitorMeta && id in monitorMeta

      const { kind = null, project = null, location = null } = metaIsAvail ? meta[id] : {}
      const { expectedState = null } = monIsAvail ? monitorMeta[id] : {}

      return {
        ...obj,
        kind,
        project,
        location,
        status: expectedState,
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