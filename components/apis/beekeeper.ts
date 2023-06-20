import config from '/config'
const url = config.beekeeper

import { handleErrors } from '../fetch-utils'
import { NodeStatus } from './node'
import { countBy } from 'lodash'


const FILTER_NODES = true  // if true, filter to "node monitoring" list
const API_URL = `${url}/api`


export type VSN = `W${string}` | `V${string}`


export type State = {
  address: string
  beehive: string
  id: string
  internet_connection: string
  mode: string
  name: string
  project_id: null
  registration_event: string
  server_node: string
  timestamp: string

  /* dynamically computed */
  status?: NodeStatus  // may be replaced with 'mode' or such?
}


export const Buckets = [
  '1 Production', '2 Development', '3 Hacker', '4 Not Deployed'
] as const


export const phaseMap = {
  'deployed': 'Deployed',
  'pending': 'Pending Deploy',
  'maintenance': 'Maintenance',
  'standby': 'Standby',
  'retired': 'Retired'
} as const


export type PhaseTabs = keyof typeof phaseMap

export type Phase = typeof phaseMap[PhaseTabs]


export type NodeMeta = {
  vsn: VSN
  node_phase: Phase
  project: string
  focus: string
  gps_lat: number // static gpsf
  gps_lon: number // static gps
  lng?: number    // live longitude (if avail)
  lat?: number    // live latitude (if avail)
  left_camera: string
  location: string
  modem_sim: string
  node_id: string
  node_type: 'WSN' | 'Blade'
  notes: string
  modem: boolean
  nx_agent: boolean
  retire_date: string
  bottom_camera: string
  right_camera: string
  top_camera: string
  shield: boolean
  build_date: string
  shipping_address: string
  bucket?: typeof Buckets[number]
  commission_date: string
  sensor: string[]    // added client-side for joining data
}



export type OntologyObj = {
  description: string
  ontology: string // xxy.yyy.zzz
  source: `https://${string}`
  unit: string
}


function get(endpoint: string, opts={}) {
  return fetch(endpoint, opts)
    .then(handleErrors)
    .then(res => res.json())
}


export async function getNodes() {
  const data = await get(`${API_URL}/state`)
  return data.data
}


export async function getNode(id: string) : Promise<State> {
  const data = await get(`${API_URL}/state/${id}`)
  return data.data
}


type MetaParams = {node?: string, by?: 'vsn' | 'id', project?: string, focus?: string}
export type NodeMetaMap = {[id_or_vsn: string]: NodeMeta}

export async function getProdSheet(params?: MetaParams) : Promise<NodeMetaMap | NodeMeta> {
  const {node, by = 'vsn', project, focus} = params || {}

  let data = await get(`${url}/production`)

  if (project)
    data = data.filter(o => o.project == project)
  if (focus)
    data = data.filter(o => o.focus == focus)


  // special handling of gps since they are of type 'string'; todo(nc): remove
  // also, add special "sensor" list for tables and convenience
  data = data.map(o => ({
    ...o,
    gps_lat: o.gps_lat?.length ? parseFloat(o.gps_lat) : null,
    gps_lon: o.gps_lon?.length ? parseFloat(o.gps_lon) : null,
    ...({
      sensor: [
        o.top_camera, o.bottom_camera, o.left_camera, o.right_camera, 'RG-15',
        ...(o.shield ? ['ML1-WS IP54', 'BME680'] : []),
        ...(config.additional_sensors[o.vsn] || [])
      ].filter(name => name != 'none')
    })
  }))

  let mapping
  if (by == 'id') {
    mapping = data.reduce((acc, node) =>
      ({...acc, [node.node_id?.length == 16 ? node.node_id : node.vsn]: node})
    , {})
  } else if (by == 'vsn') {
    mapping = data.reduce((acc, node) => ({...acc, [node.vsn]: node}), {})
  }

  if (!node) {
    return mapping
  } else if (node.length == 16 || (node.length == 4 && by == 'vsn')) {
    if (node in mapping) {
      return getFactory({node})
        .then(factory => ({...mapping[node], factory})) as Promise<NodeMeta>
    }
    return null
  }
}



async function getMonitorData() {
  const data = await get(`${url}/monitoring`)

  return data
    .reduce((acc, {node_id, expected_online}) =>
      ({...acc, [node_id]: {expected_online}})
    , {})
}



export async function getFactory(params?: MetaParams) {
  const {node, by = 'id'} = params

  const data = await get(`${url}/factory`)

  let mapping
  if (by == 'id') {
    mapping = data.reduce((acc, node) => ({...acc, [node['node_id']]: node}), {})
  } else if (by == 'vsn') {
    mapping = data.reduce((acc, node) => ({...acc, [node.vsn]: node}), {})
  }

  return node ?
    data.filter(o => node.length == 4 ? o.vsn == node : o.node_id == node)[0] : mapping
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
      expected_online: !!expected_online,
      status: expected_online ? 'reporting' : 'offline',
      registration_event: new Date(obj.registration_event).getTime()
    }
  })
}


export async function getState() : Promise<State[]> {
  const proms = [getProdSheet(), getManifests()]
  const [meta, manifests] = await Promise.all(proms)


  // join manifests to meta
  const data = (manifests as Manifest[]).map(obj => ({
    ...obj,
    ...meta[obj.vsn],
    status: null,
    hasStaticGPS: !!obj.gps_lat && !!obj.gps_lon,
    lat: obj.gps_lat,
    lng: obj.gps_lon
  }))

  return data
}


export async function __getStateDeprecated() : Promise<State[]> {
  const proms = [getNodes(), getProdSheet(), getMonitorData()]
  let [nodes, meta, monitorMeta] = await Promise.all(proms)

  let allMeta = _joinNodeData(nodes, meta, monitorMeta)

  // whether or not to ignore things like 000000000001, laptop registration, test nodes, etc
  const shouldSanitizeNodes = monitorMeta && FILTER_NODES
  if (shouldSanitizeNodes) {
    const includeList = Object.keys(monitorMeta)
    allMeta = allMeta.filter(obj => includeList.includes(obj.id))
  }

  // Add in dell nodes (until they are in beekeeper);
  // todo(nc): remove once registered!!
  allMeta = [
    ...allMeta,
    ...Object.values(meta)
      .filter(o => o.node_type == 'Blade')
      .map(o => ({
        ...o,
        id: o.node_id?.length == 16 ? o.node_id : o.vsn,
        hasStaticGPS: !!o.gps_lat && !!o.gps_lon,
        status: 'dell node',
        lat: o.gps_lat,
        lng: o.gps_lon
      }))
  ].filter((o, i, self) =>
    i == self.findIndex(o2 => o2.id == o.id)
  )


  return allMeta
}


export async function getSuryaState() : Promise<State[]> {
  const proms = [getNodes(), getProdSheet(), getMonitorData(), getFactory({by: 'id'})]
  const [nodes, meta, monitorMeta, factory] = await Promise.all(proms)

  const allButFactory = _joinNodeData(nodes, meta, monitorMeta)
  let data = allButFactory.map(o => ({...o, factory: factory[o.id]}) )

  return data
}



export async function getOntologyList() : Promise<OntologyObj[]> {
  const data = await get(`${url}/ontology`)
  return data
}

export async function getOntology(name: string) : Promise<OntologyObj> {
  const data = await getOntologyList()
  return data.find(o => o.ontology == name) as OntologyObj
}


export type NodeDetails = (State & NodeMeta)[]

export async function getNodeDetails(bucket?: NodeMeta['bucket']) : Promise<NodeDetails> {
  const [bkData, details] = await Promise.all([getNodes(), getProdSheet({by: 'vsn'})])
  let nodeDetails = bkData
    .filter(o => !!o.vsn)
    .map(obj => ({...obj, ...details[obj.vsn]}))

  if (bucket) {
    nodeDetails = nodeDetails.filter(o => o.bucket == bucket)
  }

  return nodeDetails
}


export type PhaseCounts = {
  [phase in Phase]: number
}

export async function getPhaseCounts(project: string) : Promise<PhaseCounts> {
  let data = await get(`${url}/production`)

  if (project) {
    data = data.filter(obj => obj.project == project)
  }

  return countBy<PhaseCounts>(data, 'node_phase') as PhaseCounts
}



export type Compute = {
  name: 'rpi' | 'nxcore' | 'nxagent'
  zone: 'shield' | 'core'
}

type Sensor = {
  name: 'top' | 'bottom' | 'left' | 'right' | string
  hardware: {
    hardware: string
    hw_model: string
  }
}

type Manifest = {
  vsn: VSN
  name: string // node id
  gps_lat: number
  gps_lon: number
  computes: Compute[]
  sensor: Sensor[]
}


export type SimpleManifest = Manifest & {
  sensors: {
    name: string
    hardware: string
    hw_model: string
  }
}


export async function getManifests() : Promise<SimpleManifest[]> {
  let data = await get(`${config.auth}/manifests/`)

  data = data.map(o => ({
    vsn: o.vsn,
    name: o.name,
    gps_lat: o.gps_lat,
    gps_lon: o.gps_lon,
    computes: o.computes.map(({name, zone}) => ({name, zone})),
    sensors: o.sensors.map(({name, hardware}) => ({name, hardware: hardware.hardware, hw_model: hardware.hw_model}))
  }))

  return data
}
