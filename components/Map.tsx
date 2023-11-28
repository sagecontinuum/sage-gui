import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import 'mapbox-gl/dist/mapbox-gl.css'
import Map, {
  Marker, Popup, Source, Layer, FullscreenControl, NavigationControl,
} from 'react-map-gl'
import type { MapRef, MapProps, SymbolLayer, MapboxEvent } from 'react-map-gl'

import { ClickAwayListener } from '@mui/material'

import Clipboard from './utils/Clipboard'
import NodeLastReported from './utils/NodeLastReported'

import config from '/config'
import settings from './settings'

import * as BK from '/components/apis/beekeeper'

const {initialViewState} = settings


const DISABLE_MAP = config['disableMaps'] || false
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN ||
  'pk.eyJ1IjoibmNvbnJhZGFubCIsImEiOiJjbGt3dXhod2UxMzAyM2dwcnl4ZGJubnd1In0.' +
  'FNVNhHfEIZ2qjy8mqFQmQw'


const dotSize = 10

const mapSettings = {
  ...(initialViewState ? {initialViewState} : {
    initialViewState: {
      longitude: -99,
      latitude: 38.5,
      zoom: 3.0
    }
  }),
  mapboxAccessToken: MAPBOX_TOKEN,
  style: {height: '350px'},
  mapStyle: 'mapbox://styles/mapbox/light-v9',
  cooperativeGestures: true,
  /* 3d view
  projection: 'globe',
  fog: {}
  */
} as MapProps

const fitBoundsPadding = {top: 35, bottom: 35, left: 35, right: 35}


const getBBox = (coordinates) : [[number, number], [number, number]] => {
  const lngs = coordinates.map(o => o.lng)
  const lats = coordinates.map(o => o.lat)

  const lngMin = Math.min(...lngs)
  const lngMax = Math.max(...lngs)
  const latMin = Math.min(...lats)
  const latMax = Math.max(...lats)

  return [[lngMin, latMin], [lngMax, latMax]]
}



const getValidCoords = (data: Data[]) =>
  data.filter(({lat, lng}) => lat && lng)
    .map(({lat, lng}) => ({lng, lat}))



const getGeoSpec = (data: Data[]) => {
  const features = data
    .filter(({lat, lng}) => lat && lng)
    .map(obj => ({
      type: 'Feature',
      status: obj.status,
      geometry: {
        type: 'Point',
        coordinates: [obj.lng, obj.lat]
      },
      properties: {
        title: obj.vsn,
        description: '',
        data: obj
      },
    }))

  return {
    type: 'FeatureCollection',
    features
  }
}


const layerStyle: SymbolLayer = {
  'id': 'marker-labels',
  'type': 'symbol',
  'source': 'geoSpec',
  'layout': {
    'text-field': [
      'format',
      ['upcase', ['get', 'title']],
      { 'font-scale': 0.9 },
    ],
    'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
    'text-radial-offset': 0.5,
    'text-justify': 'auto',
    'icon-image': ['get', 'icon'],
  }
}


type PopupProps = {
  data: Data
  onClose: () => void
  showUptime: boolean
}

function PopupInfo(props: PopupProps) {
  const {onClose, data, showUptime} = props

  // tooltip info deconstruction
  const {
    vsn, project, focus, location, lng, lat, node_type, computes, elapsedTimes,
    node_phase_v3
  } = data || {}

  return (
    <Popup
      longitude={lng}
      latitude={lat}
      onClose={onClose}
    >
      <ClickAwayListener onClickAway={onClose}>
        <div className="flex gap">
          <div>
            <h2>
              {node_type == 'WSN' ?
                'Wild Sage Node' : node_type
              }&nbsp;
              <Link to={`/node/${vsn}`}>
                {vsn}
              </Link>
            </h2>
            <div>
              <table className="key-value simple node-meta">
                <tbody>
                  <tr>
                    <td>Project</td>
                    <td>
                      <Link to={`/nodes/?project="${encodeURIComponent(project)}"`}>
                        {project}
                      </Link>&nbsp;
                      {focus &&
                      <>| <Link to={
                        `/nodes/?project="${encodeURIComponent(project)}"` +
                        `&focus="${encodeURIComponent(focus)}"`
                      }>
                        {focus}
                      </Link></>
                      }
                    </td>
                  </tr>
                  <tr>
                    <td>Location</td>
                    <td>
                      <Link to={`/nodes/?city="${encodeURIComponent(location)}"`}>
                        {location}
                      </Link>
                    </td>
                  </tr>
                  <tr>
                    <td>Coordinates</td>
                    <td><Clipboard content={`${lat},\n${lng}`} tooltip="Copy coordinates" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {showUptime &&
            <div className="uptimes">
              <h2>{node_phase_v3}</h2>
              <b>Last reported metric</b><br/>
              <NodeLastReported computes={computes} elapsedTimes={elapsedTimes} />
            </div>
          }
        </div>
      </ClickAwayListener>
    </Popup>
  )
}


type Data = BK.State & {
  vsn: BK.VSN,
  lng: number,
  lat: number,
  status?: string
  elapsedTimes: {[device: string]: number }
}

type Props = {
  data: Data[]
  updateID?: number
  showUptime?: boolean
}


export default function MapGL(props: Props) {
  const {
    data = null,
    updateID,
    showUptime = true
  } = props

  const mapRef = useRef<MapRef>(null)
  const [popup, setPopup] = useState(null)

  const [geoData, setGeoData] = useState(null)
  const [markers, setMarkers] = useState<Data[]>([])

  // keep track of primary keys
  const [lastID, setLastID] = useState(-1)

  // just determine when to update for now
  useEffect(() => {
    if (DISABLE_MAP) return

    // do a manual comparison for dynamic ping updates
    if (lastID == updateID) {
      return
    }

    const d = data
    const geoData = getGeoSpec(d)
    const coords = getValidCoords(d)
    const bbox = getBBox(coords)

    setGeoData(geoData)
    setMarkers(d)

    if (mapRef.current && coords.length) {
      mapRef.current.fitBounds(bbox, { padding: fitBoundsPadding, maxZoom: 10 })
    }

    setLastID(updateID)
  }, [data, updateID, lastID])


  const handleClick = (evt: MapboxEvent<MouseEvent>, obj: Data) => {
    evt.originalEvent.stopPropagation()
    setPopup(obj)
  }

  return (
    <Root>
      <Map ref={mapRef} {...mapSettings}>
        <FullscreenControl />
        <NavigationControl position="bottom-right" showCompass={false} />

        {geoData &&
          <Source id="markers" type="geojson" data={geoData}>
            <Layer {...layerStyle} />
          </Source>
        }

        {markers
          .filter(o => o.lng && o.lat)
          .map(obj => {
            const {vsn, lng, lat, status} = obj
            return (
              <Marker key={vsn}
                longitude={lng}
                latitude={lat}
                onClick={(evt) => handleClick(evt, obj)}
              >
                <div className={`marker-dot marker-${(status || '').replace(/ /g, '-')}`}></div>
              </Marker>
            )
          })}

        {popup &&
          <PopupInfo data={popup} onClose={() => setPopup(null)} showUptime={showUptime} />
        }
      </Map>
    </Root>
  )
}


const Root = styled.div`
  width: 100%;

  .popup-title {
    margin-top: 0;
  }

  .mapboxgl-marker {
    cursor: pointer;
  }

  .marker-dot {
    height: ${dotSize}px;
    width: ${dotSize}px;
    border: 1px solid #666;
    // background: #d8d8d8;
    border-radius: 50%;
    display: inline-block;
  }

  .marker-reporting  {
    background: #3ac37e;
    border: 1px solid #2b9962;
    opacity: .65;
  }

  .marker-degraded {
    background: hsl(41, 83%, 35%);
  }

  .marker-not-reporting {
    background: #d72020;
    border: 1px solid #992727;
    opacity: .65;
  }

  .mapboxgl-popup-content {
    width: fit-content;

    .node-meta {
      width: 50%;
    }
    .uptimes {
      width: 50%;
      white-space: nowrap;
    }
  }

  .clipboard-content {
    margin-right: 20px;
  }
`
