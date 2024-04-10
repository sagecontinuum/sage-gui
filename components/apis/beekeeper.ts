import config from '/config'
const url = config.beekeeper
const API_URL = `${url}/api`

import settings from '/components/settings'
const PROJECT = settings.project

import { handleErrors } from '../fetch-utils'
import { NodeStatus } from './node'
import USStates from './us-states'
import { getCarrierName } from './carrier-codes'

import Auth from '../auth/auth'

const __token = Auth.token

const options = {
  headers: __token ? {
    Authorization: `sage ${__token}`
  } : {}
}


export type VSN = `W${string}` | `V${string}`


export type BKState = {
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
  'awaiting': 'Awaiting Deployment',
  'pending': 'Shipment Pending',
  'maintenance': 'Maintenance',
  'standby': 'Standby',
  'retired': 'Retired'
} as const


export type PhaseTabs = keyof typeof phaseMap

export type Phase = typeof phaseMap[PhaseTabs]


export type NodeMeta = {
  vsn: VSN
  node_phase_v3: Phase
  project: string
  focus: string
  gps_lat: number // static gps
  gps_lon: number // static gps
  lng?: number    // live longitude (if avail)
  lat?: number    // live latitude (if avail)
  left_camera: string
  location: string
  node_id: string
  node_type: 'WSN' | 'Blade'
  notes: string
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
  unit: string  // todo(nc): change to "type"
  units: string
}


function get(endpoint: string, opts={}) {
  return fetch(endpoint, opts)
    .then(handleErrors)
    .then(res => res.json())
}


function put(endpoint: string, data) {
  const putOptions = {
    'headers': {
      ...options.headers,
      'Content-Type': 'application/json'
    },
    'method': 'PUT',
    'body': JSON.stringify(data)
  }

  return fetch(endpoint, putOptions)
    .then(handleErrors)
    .then(res => res.json())
}


export async function getNodes() {
  const data = await get(`${API_URL}/state`)
  return data.data
}


export async function getNode(id: string) : Promise<BKState> {
  const data = await get(`${API_URL}/state/${id}`)
  return data.data
}


type FilteringArgs = {
  project?: string,
  focus?: string,
  nodes?: VSN[]
}

export type NodeMetaMap = {[id_or_vsn: string]: NodeMeta}


// to be deprecated
export async function getNodeMeta(args?: FilteringArgs) : Promise<NodeMetaMap>
export async function getNodeMeta(vsn?: VSN) : Promise<NodeMeta>
export async function getNodeMeta(args?: VSN | FilteringArgs) : Promise<NodeMeta | NodeMetaMap> {
  let data = await get(`${url}/production`)

  const isSingleNode = typeof args === 'string'

  if (!isSingleNode) {
    const {project, focus, nodes} = args || {}
    if (nodes)
      data = data.filter(o => nodes.includes(o.vsn))
    else {
      if (project)
        data = data.filter(o => o.project.toLowerCase() == project.toLowerCase())
      if (focus)
        data = data.filter(o => o.focus.toLowerCase() == focus.toLowerCase())
    }
  }

  data = data.map(obj => {
    const {location: loc} = obj
    const part = loc?.includes(',') ? loc?.split(',').pop().trim() : loc
    const state = part in USStates ? `${USStates[part]} (${part})` : part

    return {
      ...obj,
      state,
      city: loc,
    }
  })

  const mapping: NodeMetaMap = data.reduce((acc, node) => ({...acc, [node.vsn]: node}), {})

  return isSingleNode ? (mapping[args] || null) : mapping
}


export async function getFactory(vsn?: VSN) {
  const data = await get(`${url}/factory`)
  const mapping = data.reduce((acc, node) => ({...acc, [node.vsn]: node}), {})
  return vsn ? data.find(o => o.vsn == vsn) : mapping
}


export type ComputeHardware = {
  hardware: string      // rpi-4gb
  hw_model: string      // RPI4B
  hw_version: string    // rpi4b-4g
  sw_version: string
  manufacturer: string  // Raspberry Pi
  datasheet: string     // https://www.foo.bar
  capabilities: ('arm64' | 'poe')[]
  description: string
  cpu: string           // 4000
  cpu_ram: string       // 4096
  gpu_ram: string ,
  shared_ram: boolean
}


export type Compute = {
  name: 'rpi' | 'rpi-shield' | 'nxcore' | 'nxagent'
  serial_no: string       // most likely 12 digit, uppercase hex
  zone: 'shield' | 'core'
  hardware: ComputeHardware
}


export type SensorHardware = {
  hardware: string        // ptz-8081
  hw_model: string        // XNV-8081Z
  hw_version: string
  sw_version: string
  manufacturer: string    // 'some manufacturer'
  datasheet: string       // https://foo.bar
  capabilities: string[]
  description: string
}


type Sensor = {
  name: 'top' | 'bottom' | 'left' | 'right' | string
  scope: 'global' | 'nxcore' | 'rpi-shield'
  labels: string[],
  serial_no: string,
  uri: string,
  hardware: SensorHardware
}


type ResourceHardware = {
  hardware: string
  hw_model: string
  hw_version: string
  sw_version: string
  manufacturer: string
  datasheet: string
  capabilities: string[]
  description: string
}


type Resource = {
  name: 'usbhub' | 'switch' | 'wagman' | 'psu' | 'wifi' | string
  hardware: ResourceHardware
}

type LorawanDevice = {
  name: string
  deveui: string
  battery_level: number
  hardware: SensorHardware
}

export type LorawanConnection = {
  connection_name: string
  deveui: string
  last_seen_at: string
  margin: number
  expected_uplink: number
  lorawandevice: LorawanDevice
}

type Manifest = {
  vsn: VSN
  name: string          // node id
  phase: Phase
  gps_lat?: number
  gps_lon?: number
  modem?: {
    model:  string        // mtcm2,
    sim_type: string      // anl-nu,
    carrier: string       // 310030
    carrier_name?: string // added client-side
  }
  tags?: string[]
  computes: Compute[]
  sensors: Sensor[]
  resources: Resource[]
  lorawanconnections: LorawanConnection[]
}


export type FlattenedManifest = Omit<Manifest, 'sensors'> & {
  computes: (Omit<Compute, 'hardware'> & ComputeHardware)[]
  sensors: (Omit<Sensor, 'hardware'> & SensorHardware)[]
  resources: (Omit<Resource, 'hardware'> & ResourceHardware)[]
  lorawanconnections: (Omit<LorawanConnection, 'lorawandevice'> & {
    lorawandevice: Omit<LorawanDevice, 'hardware'> & SensorHardware})[]
}


export type SimpleManifest = Omit<Manifest, 'computes' | 'sensors'> & {
  computes: {
    name: Compute['name']
    serial_no: Compute['serial_no']
    zone: Compute['zone']
  }[]
  sensors: {
    name: Sensor['name']
    hardware: SensorHardware['hardware']
    hw_model: SensorHardware['hw_model']
  }[]
}


// used for tables, such as in node tables
const toSimpleManifest = o => ({
  vsn: o.vsn,
  name: o.name,
  gps_lat: o.gps_lat,
  gps_lon: o.gps_lon,
  modem_model: o.modem?.model,
  modem_hw_model: o.resources.find(obj => obj.name == 'modem')?.hardware.hw_model,
  modem_sim_type: o.modem?.sim_type,
  modem_carrier: o.modem?.carrier,
  ...(o.modem && { modem_carrier_name: getCarrierName(o.modem?.carrier) }),
  computes: o.computes.map(({name, serial_no, zone}) => ({
    name,
    serial_no,
    zone
  })),
  sensors: o.sensors.map(({name, scope, hardware}) => ({
    name,
    scope,
    hardware: hardware.hardware,
    hw_model: hardware.hw_model,
    description: hardware.description,
    capabilities: hardware.capabilities
  })).sort((a) => a.name != a.hw_model.toLowerCase() ? -1 : 1)
})


// a convenient, flattened representation
const flattenManifest = o => ({
  vsn: o.vsn,
  name: o.name,
  gps_lat: o.gps_lat,
  gps_lon: o.gps_lon,
  modem_model: o.modem?.model,
  modem_hw_model: o.resources.find(obj => obj.name == 'modem')?.hardware.hw_model,
  modem_sim_type: o.modem?.sim_type,
  modem_carrier: o.modem?.carrier,
  ...(o.modem && { modem_carrier_name: getCarrierName(o.modem?.carrier) }),
  project: o.project,
  address: o.address,
  lorawanconnections: o.lorawanconnections.map(({lorawandevice, ...rest}) => ({
    ...rest,
    ...lorawandevice,
    ...(lorawandevice.hardware && {
      ...lorawandevice.hardware })
  })),
  computes: o.computes.map(({hardware, ...rest}) => ({
    ...rest,
    ...hardware
  })),
  sensors: o.sensors.map(({hardware, ...rest}) => ({
    ...rest,
    ...hardware
  })).sort((a) => a.name != a.hw_model.toLowerCase() ? -1 : 1),
  resources:
    o.resources.map(({name, hardware}) => ({name, ...hardware}))
})


export async function getRawManifests() : Promise<Manifest[]> {
  const p1 = getNodeMeta()
  const p2 = await get(`${config.auth}/manifests/`)

  const [nodeMetas, data] = await Promise.all([p1, p2])

  const vsns = Object.values(nodeMetas).map(o => o.vsn)
  const manifests = data.filter(o => vsns.includes(o.vsn))

  return manifests
}


export async function getManifests() : Promise<FlattenedManifest[]> {
  let data = await get(`${config.auth}/manifests/`)
  data = data.map(flattenManifest)

  return data
}


export async function getManifest(vsn: VSN) : Promise<FlattenedManifest> {
  let data = await get(`${config.auth}/manifests/${vsn}`)
  data = flattenManifest(data)

  return data
}


export async function getSimpleManifests() : Promise<SimpleManifest[]> {
  let data = await get(`${config.auth}/manifests/`)
  data = data.map(toSimpleManifest)

  return data
}



export type SensorListRow = SensorHardware & {
  vsns: VSN[]
}

export async function getAllSensors() : Promise<SensorListRow[]> {
  const data = await get(`${config.auth}/sensors/`)
  return data
}


export async function getSensors() : Promise<SensorListRow[]> {
  const project = PROJECT

  const params = [
    project ? `project=${project}` : '',
    project.toLowerCase() == 'sage' ?
      `phase=${['Deployed', 'Awaiting Deployment', 'Maintenance'].join(',')}` : ''
  ]

  const data = await get(`${config.auth}/sensors/?${params.join('&')}`)
  return data
}


// Note: the API provided to fetch a sensor is /sensors/<hardware>,
// while the front-end uses /sensors/<hw_model>
export async function getSensor(hw_model: string) : Promise<SensorListRow> {
  const data = await getSensors()
  return data.find(obj => obj.hw_model == hw_model)
}

export function saveSensor(state: SensorHardware) : Promise<SensorHardware> {
  return put(`${config.auth}/sensorhardwares/${state.hw_model}`, state)
}



// helper function normalize/match:
// 0000456789abcdef.<suffix> (in beehive) 456789abcdef (in manifest)
export function findHostWithSerial(hosts: string[], serial_no: string) : string {
  return hosts.find(host =>
    host.split('.')[0].slice(4).toUpperCase() == serial_no.toUpperCase()
  )
}



export type State = SimpleManifest & {
  node_phase_v3: NodeMeta['node_phase_v3']
  project: NodeMeta['project']
  focus: NodeMeta['focus']
  location: NodeMeta['location']
  node_type: NodeMeta['node_type']
  nx_agent: NodeMeta['nx_agent']
  shield: NodeMeta['shield']
  build_date: string
  commission_date: string
  sensor?: string[]    // added client-side for joining data

  status: string
  hasStaticGPS: boolean
  lat: number
  lng: number
}


export async function getState() : Promise<State[]> {
  const res = await Promise.all([getNodeMeta(), getSimpleManifests()])
  const nodeMeta = res[0]
  let data = res[1]

  // join manifests to meta
  data = data
    .filter(o => !!o.computes.length && o.vsn in nodeMeta)
    .map(obj => {
      const meta = nodeMeta[obj.vsn]
      const {location: loc} = meta

      // allow "<city>, <state_abbrev>", "<city>, <country>",
      // "<state>", or "<country>", etc., for now.
      const part = loc?.includes(',') ? loc?.split(',').pop().trim() : loc
      const state = part in USStates ? `${USStates[part]} (${part})` : part

      return {
        ...obj,
        node_phase_v3: meta.node_phase_v3,
        project: meta.project,
        focus: meta.focus,
        state,
        city: loc,
        location: loc,  // same as city for now
        node_type: meta.node_type,
        nx_agent: meta.nx_agent,
        shield: meta.shield,
        build_date: meta.build_date,
        commission_date: meta.commission_date,
        status: null,
        hasStaticGPS: !!obj.gps_lat && !!obj.gps_lon,
        lat: obj.gps_lat,
        lng: obj.gps_lon,
        sensor: obj.sensors.map(o => o.hw_model)
      }
    })


  return data as State[]
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

export async function getNodeDetails() : Promise<NodeDetails> {
  const [bkData, details] = await Promise.all([getNodes(), getNodeMeta()])
  const nodeDetails = bkData
    .filter(o => !!o.vsn)
    .map(obj => ({...obj, ...details[obj.vsn]}))

  return nodeDetails
}


export async function getProduction() {
  return await get(`${url}/production`)
}

