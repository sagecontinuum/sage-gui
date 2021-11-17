import config from '../../config'
const url = config.beekeeper

import { NodeStatus } from '../node'
import tokens from '../../tokens'


const SHEETS_URL = `https://sheets.googleapis.com/v4/spreadsheets`
const API_URL = `${url}/api`
const NODE_MANIFEST = `${url}/production`


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
  node_type?: string
  project?: string
  location?: string    // currently part of "project" in mock data
  status?: NodeStatus  // may be replaced with 'mode' or such?
}


function handleErrors(res) {
  if (res.ok) {
    return res
  }

  return res.json().then(errorObj => {
    throw Error(errorObj.error)
  })
}


function get(endpoint: string, opts={}) {
  return fetch(endpoint, opts)
    .then(handleErrors)
    .then(res => res.json())
}



async function getMonitorData() {
  const data = await get(`${SHEETS_URL}/1ZuwMfmGvHgRLAaoJBlBNJ3MO7FuqmkV__4MFinNm8Fk/values/main!A2:B100?key=${process.env.GOOGLE_TOKEN || tokens.google}`)

  return data.values.reduce((acc, [id, expectedState]) =>
    ({...acc, [id]: {expectedState}})
  , {})
}



type ManifestArgs = {node?: string, by?: 'vsn' | 'id'}

export async function getManifest(params: ManifestArgs) {
  const {node, by} = params ?? {by: 'id'}

  const data = await get(NODE_MANIFEST, {cache: 'reload'})

  let mapping

  let d = data.filter(obj => 'node_id' in obj)
  if (by == 'id') {
    mapping = d.reduce((acc, node) => ({...acc, [node['node_id']]: node}), {})
  } else if (by == 'vsn') {
    mapping = d.reduce((acc, node) => ({...acc, [node.vsn]: node}), {})
  }

  if (!node) {
    return mapping
  } else if (node.length == 16 || (node.length == 4 && by == 'vsn')) {
    return mapping[node]
  } else {
    throw 'getManifest: must provide `by=vsn` option if filtering to a node by VSN'
  }
}


function _joinNodeData(nodes, nodeMetas, monitorMeta) {
  return nodes.map(obj => {
    const {id} = obj

    const meta = nodeMetas[id]
    const monIsAvail = monitorMeta && id in monitorMeta

    const { expectedState = null } = monIsAvail ? monitorMeta[id] : {}

    return {
      ...obj,
      ...meta,
      status: expectedState,
      registration_event: new Date(obj.registration_event).getTime()
    }
  })
}


export async function fetchState() : Promise<State[]> {
  const proms = [getNodes(), getManifest(), getMonitorData()]
  let [nodes, meta, monitorMeta] = await Promise.all(proms)

  const shouldFilter = monitorMeta && config.admin.filterNodes
  const includeList = Object.keys(monitorMeta)
  nodes = nodes.filter(obj => shouldFilter ? includeList.includes(obj.id) : true)

  return _joinNodeData(nodes, meta, monitorMeta)
}



export async function fetchSuryaState() : Promise<State[]> {
  const proms = [getNodes(), getManifest(), getMonitorData()]
  let [nodes, meta, monitorMeta] = await Promise.all(proms)
  return _joinNodeData(nodes, meta, monitorMeta)

}


export async function getNodes() {
  const data = await get(`${API_URL}/state`)
  return data.data
}

export async function getNode(id: string) : Promise<State[]> {
  const data = await get(`${API_URL}/state/${id}`)
  return data.data
}

