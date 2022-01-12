import config from '../../config'
const url = config.beekeeper

import { NodeStatus } from '../node'


const API_URL = `${url}/api`


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
  vsn: string
  node_type?: string
  project?: string
  location?: string    // currently part of "project" in mock data
  status?: NodeStatus  // may be replaced with 'mode' or such?
}

 export type OntologyObj = {
  description: string
  ontology: string // xxy.yyy.zzz
  source: string   // url
  unit: string
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
  const data = await get(`${url}/monitoring`)

  return data
    .filter(obj => 'node_id' in obj)
    .reduce((acc, {node_id, expected_online}) =>
      ({...acc, [node_id]: {expected_online}})
    , {})
}



type MetaParams = {node?: string, by?: 'vsn' | 'id'}

export async function getManifest(params?: MetaParams) {
  let {node, by = 'id'} = params || {}

  const data = await get(`${url}/production`, {cache: 'reload'})
  const d = data.filter(obj => 'node_id' in obj)


  let mapping
  if (by == 'id') {
    mapping = d.reduce((acc, node) => ({...acc, [node['node_id']]: node}), {})
  } else if (by == 'vsn') {
    mapping = d.reduce((acc, node) => ({...acc, [node.vsn]: node}), {})
  }

  if (!node) {
    return mapping
  } else if (node.length == 16 || (node.length == 4 && by == 'vsn')) {
    if (node in mapping) {
      return getFactory({node})
        .then(factory => ({...mapping[node], factory}))
    }
    return null
  } else {
    throw 'getManifest: must provide `by=vsn` option if filtering to a node by VSN'
  }
}


export async function getFactory(params?: MetaParams) {
  const {node, by = 'id'} = params

  const data = await get(`${url}/factory`)
  const d = data.filter(obj => 'node_id' in obj)

  let mapping
  if (by == 'id') {
    mapping = d.reduce((acc, node) => ({...acc, [node['node_id']]: node}), {})
  } else if (by == 'vsn') {
    mapping = d.reduce((acc, node) => ({...acc, [node.vsn]: node}), {})
  }

  return node ?
    d.filter(o => node.length == 4 ? o.vsn == node : o.node_id == node)[0] : mapping
}


function _joinNodeData(nodes, nodeMetas, monitorMeta) {
  return nodes.map(obj => {
    const {id} = obj

    const meta = nodeMetas[id]
    const monIsAvail = monitorMeta && id in monitorMeta

    const { expected_online = null } = monIsAvail ? monitorMeta[id] : {}

    return {
      ...obj,
      ...meta,
      status: expected_online ? 'reporting' : 'offline',
      registration_event: new Date(obj.registration_event).getTime()
    }
  })
}



export async function getState() : Promise<State[]> {
  const proms = [getNodes(), getManifest(), getMonitorData()]
  let [nodes, meta, monitorMeta] = await Promise.all(proms)

  const shouldFilter = monitorMeta && config.admin.filterNodes
  const includeList = Object.keys(monitorMeta)
  nodes = nodes.filter(obj => shouldFilter ? includeList.includes(obj.id) : true)

  return _joinNodeData(nodes, meta, monitorMeta)
}



export async function getSuryaState() : Promise<State[]> {
  const proms = [getNodes(), getManifest(), getMonitorData(), getFactory({by: 'id'})]
  const [nodes, meta, monitorMeta, factory] = await Promise.all(proms)

  const allButFactory = _joinNodeData(nodes, meta, monitorMeta)
  const allSuryaData = allButFactory.map(o => ({...o, factory: factory[o.id]}) )
  return allSuryaData
}



export async function getNodes() {
  const data = await get(`${API_URL}/state`)
  return data.data
}



export async function getNode(id: string) : Promise<State[]> {
  const data = await get(`${API_URL}/state/${id}`)
  return data.data
}



export async function getOntologyList() : Promise<OntologyObj[]> {
  const data = await get(`${url}/ontology`)
  return data
}

export async function getOntology(name: string) : Promise<OntologyObj> {
  const data = await getOntologyList()
  return data.find(o => o.ontology == name) as OntologyObj
}

