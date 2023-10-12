import config from '/config'
const url = config.beekeeper

import { handleErrors } from '../fetch-utils'
import { NodeStatus } from './node'

const API_URL = `${url}/api`

import USStates from './us-states'


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
  node_phase: Phase
  node_phase_v3: Phase
  project: string
  focus: string
  gps_lat: number // static gps
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


export async function getNode(id: string) : Promise<BKState> {
  const data = await get(`${API_URL}/state/${id}`)
  return data.data
}


type FilteringArgs = {
  project?: string,
  focus?: string,
  nodes?: VSN[]
}

type MetaParams = {vsn?: VSN} & FilteringArgs

export type NodeMetaMap = {[id_or_vsn: string]: NodeMeta}


export async function getNodeMeta(args?: MetaParams) : Promise<NodeMetaMap | NodeMeta> {
  const {vsn, project, focus, nodes} = args || {}

  let data = await get(`${url}/production`)

  if (project)
    data = data.filter(o => o.project.toLowerCase() == project.toLowerCase())
  if (focus)
    data = data.filter(o => o.focus.toLowerCase() == focus.toLowerCase())
  if (nodes)
    data = data.filter(o => nodes.includes(o.vsn))

  const mapping = data.reduce((acc, node) => ({...acc, [node.vsn]: node}), {})

  return vsn ? (mapping[vsn] || null) : mapping
}


export async function getFactory(vsn?: VSN) {
  const data = await get(`${url}/factory`)
  const mapping = data.reduce((acc, node) => ({...acc, [node.vsn]: node}), {})
  return vsn ? data.find(o => o.vsn == vsn) : mapping
}


export type Compute = {
  name: 'rpi' | 'rpi-shield' | 'nxcore' | 'nxagent'
  serial_no: string       // most likely 12 digit, uppercase hex
  zone: 'shield' | 'core'
  hardware: {
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
}

type Sensor = {
  name: 'top' | 'bottom' | 'left' | 'right' | string
  scope: 'global' | 'nxcore' | 'rpir-shield'
  labels: string[],
  serial_no: string,
  uri: string,
  hardware: {
    hardware: string        // ptz-8081
    hw_model: string        // XNV-8081Z
    hw_version: string
    sw_version: string
    manufacturer: string    // 'some manfacturer'
    datasheet: string       // https://foo.bar
    capabilities: string[]
    description: string
  }
}

type Resource = {
  name: 'usbhub' | 'switch' | 'wagman' | 'psu' | 'wifi' | string
  hardware: {
    hardware: string
    hw_model: string
    hw_version: string
    sw_version: string
    manufacturer: string
    datasheet: string
    capabilities: string[]
    description: string
  }
}

type LorawanDevice = {
  name: string
  dev_eui: string
  last_seen_at: string
  battery_level: number
  margin: number
  expected_uplink: number
}

type Manifest = {
  vsn: VSN
  name: string          // node id
  gps_lat?: number
  gps_lon?: number
  modem?: {
    model:  string      // mtcm2,
    sim_type: string    // anl-nu,
    carrier: string     // 310030
  }
  tags?: string[]
  computes: Compute[]
  sensors: Sensor[]
  lorawandevices: LorawanDevice[]
}


export type FlattenedManifest = Manifest & {
  computes: (Omit<Compute, 'hardware'> & Compute['hardware'])[]
  sensors: (Omit<Sensor, 'hardware'> & Sensor['hardware'])[]
  resources: (Omit<Resource, 'hardware'> & Resource['hardware'])[]
}


export type SimpleManifest = Manifest & {
  computes: {
    name: Compute['name']
    serial_no: Compute['serial_no']
    zone: Compute['zone']
  }
  sensors: {
    name: Sensor['name']
    hardware: Sensor['hardware']['hardware']
    hw_model: Sensor['hardware']['hw_model']
  }[]
}


// used for tables, such as in node tables
const toSimpleManifest = o => ({
  vsn: o.vsn,
  name: o.name,
  gps_lat: o.gps_lat,
  gps_lon: o.gps_lon,
  computes: o.computes.map(({name, serial_no, zone}) => ({
    name,
    serial_no,
    zone
  })),
  sensors: o.sensors.map(({name, scope, hardware}) => ({
    name,
    scope,
    hardware: hardware.hardware,
    hw_model: hardware.hw_model
  })).sort((a, b) => a.name != a.hw_model.toLowerCase() ? -1 : 1)
})


// a convenient, flattened representation
const flattenManifest = o => ({
  vsn: o.vsn,
  name: o.name,
  gps_lat: o.gps_lat,
  gps_lon: o.gps_lon,
  modem: o.modem,
  lorawandevices: o.lorawandevices,
  computes: o.computes.map(({hardware, ...rest}) => ({
    ...rest,
    ...hardware
  })),
  sensors: o.sensors.map(({hardware, ...rest}) => ({
    ...rest,
    ...hardware
  })).sort((a, b) => a.name != a.hw_model.toLowerCase() ? -1 : 1),
  resources:
    o.resources.map(({name, hardware}) => ({name, ...hardware}))
})


export async function getManifest(vsn: VSN) : Promise<FlattenedManifest> {
  let data = await get(`${config.auth}/manifests/${vsn}`)
  data = flattenManifest(data)

  return data
}



export async function getManifests() : Promise<SimpleManifest[]> {
  let data = await get(`${config.auth}/manifests/`)
  data = data.map(toSimpleManifest)

  return data
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
  modem: NodeMeta['modem']
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
  const res = await Promise.all([getNodeMeta(), getManifests()])
  const nodeMeta = res[0]
  let data = res[1]

  // join manifests to meta
  data = (data as SimpleManifest[])
    .filter(o => !!o.computes.length)
    .map(obj => {
      const meta = nodeMeta[obj.vsn] || {}
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
        modem: meta.modem,
        nx_agent: meta.nx_agent,
        shield: meta.shield,
        build_date: meta.build_date,
        commission_date: meta.commission_date,
        status: null,
        hasStaticGPS: !!obj.gps_lat && !!obj.gps_lon,
        lat: obj.gps_lat,
        lng: obj.gps_lon
      }
    })

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

