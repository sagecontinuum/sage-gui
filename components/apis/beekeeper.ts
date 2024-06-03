import config from '/config'
const url = config.beekeeper
const API_URL = `${url}/api`

import settings from '/components/settings'
const PROJECT = settings.project

import { keyBy } from 'lodash'
import { handleErrors, handleDjangoErrors } from '../fetch-utils'
import { NodeStatus } from './node'
import parseAddress from 'parse-address/address'
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


export type Node = {
  id: number,
  vsn: VSN
  name: string
  project: 'SAGE' | 'CROCUS' | 'APIARY' | 'VTO' | 'DAWN'
  focus: 'Rural' | 'Urban' | 'Training and Development' | string
  type: 'WSN' | 'Blade'
  site_id: string
  gps_lat: number
  gps_lon: number
  gps_alt: number
  address: string
  location: string
  phase: Phase
  commissioned_at: `${string}Z`
  registered_at: `${string}Z`
  modem_sim: string
  modem_model: string
  modem_carrier: string
  sensors: {
      name: string
      hw_model: string
      manufacturer: string
      capabilities: string[]
  }[]
  computes: {
    name: string
    serial_no: string
    hw_model: string
    manufacturer: string
    capabilities: string[]
  }[]

  // added client-side convenience
  hasStaticGPS: boolean
  modem_carrier_name: 'AT&T' | string // todo(nc): move to backend
  top_camera: string                  // hw_model
  bottom_camera: string               // hw_model
  right_camera: string                // hw_model
  left_camera: string                 // hw_model
}


export type NodeState = Node & {
  sensor: string[]    // added client-side for joining data

  // determined from the data stream
  status: string
  hasLiveGPS: boolean
  lat: number
  lng: number
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

// special django error handling
function getDjangoData(endpoint: string, opts={}) {
  return fetch(endpoint, opts)
    .then(handleDjangoErrors)
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


export async function getBKStates() {
  const data = await get(`${API_URL}/state`)
  return data.data
}


export async function getBKState(id: string) : Promise<BKState> {
  const data = await get(`${API_URL}/state/${id}`)
  return data.data
}

export type NodeDict = {[vsn: VSN]: Node}


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
    host.split('.')[0].slice(4).toUpperCase() == serial_no?.toUpperCase()
  )
}


type GetNodeArgs = {
  project?: Node['project']
  vsns?: VSN[]
}

export async function getNodes(args?: GetNodeArgs) : Promise<Node[]> {
  const nodes = await _getNodeMetas(args)

  return nodes
    .filter(o => !!o.computes.length)
    .map(obj => _sanitizeMeta(obj))
}


export async function getNodeDict(args?: GetNodeArgs) : Promise<NodeDict> {
  const nodes = await getNodes(args)
  return keyBy(nodes, 'vsn')
}


export async function getNode(vsn: VSN) : Promise<Node> {
  const node = await _getNodeMeta(vsn)
  return _sanitizeMeta(node)
}


export async function getOntologyList() : Promise<OntologyObj[]> {
  const data = await get(`${url}/ontology`)
  return data
}


export async function getOntology(name: string) : Promise<OntologyObj> {
  const data = await getOntologyList()
  return data.find(o => o.ontology == name) as OntologyObj
}


export async function getFactory() {
  const data = await get(`${url}/factory`)
  return keyBy(data, 'vsn')
}



async function _getNodeMetas(args: GetNodeArgs) : Promise<Node[]>{
  const {project, vsns} = args || {}

  let url = `${config.auth}/api/v-beta/nodes/`

  if (project)
    url += `?project__name=${project}`

  let meta = await getDjangoData(url)

  if (vsns)
    meta = meta.filter(o => vsns.includes(o.vsn))

  return meta
}


function _getNodeMeta(vsn: VSN) : Promise<Node>{
  return getDjangoData(`${config.auth}/api/v-beta/nodes/${vsn}`)
}


function _sanitizeMeta(obj: Node) {
  const {city, state} = parseAddr(obj.address)

  const stateAbbrev = state?.toUpperCase()

  return {
    ...obj,
    state: stateAbbrev in USStates ? `${USStates[state]} (${stateAbbrev})` : stateAbbrev,
    city: `${city}, ${state}`,
    stateStr: state,
    cityStr: city,
    hasStaticGPS: !!obj.gps_lat && !!obj.gps_lon,
    lat: obj.gps_lat,
    lng: obj.gps_lon,
    modem_carrier_name: obj.modem_carrier ? getCarrierName(obj.modem_carrier) : null,
    top_camera: obj.sensors.find(o => o.name == 'top_camera')?.hw_model,
    bottom_camera: obj.sensors.find(o => o.name == 'bottom_camera')?.hw_model,
    left_camera: obj.sensors.find(o => o.name == 'left_camera')?.hw_model,
    right_camera: obj.sensors.find(o => o.name == 'right_camera')?.hw_model,
    // todo(nc) -- for filtering, but should remove/improve
    sensor: obj.sensors.map(o => o.hw_model)

  }
}


function parseAddr(addressStr: string) {

  // ignore possible names, support 1 or 2 line addresses
  const lines = addressStr.split(/\r?\n/)

  let address
  // if one line, assume only address
  if (lines.length == 1) {
    address = lines[0]
    // if one line, assume address
  } else if (lines.length == 2 || lines.length == 3) {
    address = lines.slice(1).join(', ')
  } else {
    console.error('address format not recognized:\n\n', address)
    return
  }

  let parts = address.split(', ')
  let city, state

  // if 4 parts, reduce to `<city>, <state> <zip?>`
  if (parts.length == 4) {
    parts = parts.slice(2)
  }

  const stateZip = parts[1]?.split(' ') // last part of address may or may not include zip

  if (parts.length == 2 && stateZip.length == 2)
    [city, state] = [parts[0], ...stateZip]
  // if one comma without zip, assume `<city>, <state>`
  else if (parts.length == 2 && stateZip.length == 1)
    [city, state] = parts
  // if 2 commas, as <place, city, state>, we extract the <city, state>
  else if (parts[0].split(' ').length == 1)
    [city, state] = parts.slice(1)
  // otherwise, use address parser
  else
    ({city, state} = parseAddress.parseLocation(address) || {})

  return {city, state}
}


