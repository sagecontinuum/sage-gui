import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import Map, {
  Marker, Popup, Source, Layer,
  FullscreenControl, NavigationControl
} from 'react-map-gl'
import type { MapRef } from 'react-map-gl'

import { ClickAwayListener } from '@mui/material'

import Clipboard from './utils/Clipboard'
import type { Manifest } from '/components/apis/beekeeper'
import config from '/config'


const DISABLE_MAP = config['disableMaps'] || false
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || 'xyz.123'

const dotSize = 10

const mapSettings = {
  initialViewState: {
    longitude: -99,
    latitude: 38.5,
    zoom: 3.0
  },
  mapboxAccessToken: MAPBOX_TOKEN,
  style: {height: '350px'},
  mapStyle: 'mapbox://styles/mapbox/light-v9',
  cooperativeGestures: true
}

const fitBoundsPadding = {top: 35, bottom: 35, left: 35, right: 35}


const getBBox = (coordinates) => {
  const lngs = coordinates.map(o => o.lng)
  const lats = coordinates.map(o => o.lat)

  const lngMin = Math.min(...lngs)
  const lngMax = Math.max(...lngs)
  const latMin = Math.min(...lats)
  const latMax = Math.max(...lats)

  return [[lngMin, latMin], [lngMax, latMax]]
}



const getValidCoords = (data) =>
  data.filter(({lat, lng}) => lat && lng && lat != 'N/A' && lng != 'N/A')
    .map(({lat, lng}) => ({lng, lat}))



const getGeoSpec = (data) => {
  const nodes = data
    .filter(({lat, lng}) => lat && lng && lat != 'N/A' && lng != 'N/A')
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
    features: nodes
  }
}


const layerStyle = {
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


type VSN = `W${string}` | `V${string}`

type Data = {
  id: string,
  vsn: VSN ,
  lng: number,
  lat: number,
  status?: string
}[]

type Props = {
  data: Data
  updateID: number
  vsn?: VSN
  resize?: boolean
}


export default function MapGL(props: Props) {
  const {
    data = null,
    updateID
  } = props

  const mapRef = useRef<MapRef>(null)
  const [popup, setPopup] = useState(null)

  const [geoData, setGeoData] = useState(null)
  const [markers, setMarkers] = useState([])

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


  const handleClick = (evt, obj) => {
    evt.originalEvent.stopPropagation()
    setPopup(obj)
  }


  // tooltip info deconstruction
  const {
    vsn, project, focus, location, lng, lat, node_type
  }: Manifest = popup || {}


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

        {markers.map(obj => {
          const {vsn, lng, lat, status} = obj

          if (!lng || !lat)
            return <></>

          return (
            <Marker key={vsn}
              longitude={lng}
              latitude={lat}
              onClick={(evt) => handleClick(evt, obj)}
            >
              <div className={`marker-dot marker-${status}`}></div>
            </Marker>
          )
        })}

        {vsn &&
          <Popup
            longitude={lng}
            latitude={lat}
            onClose={() => setPopup(null)}
          >
            <ClickAwayListener onClickAway={() => setPopup(null)}>
              <div>

                <h2>
                  {node_type == 'WSN' ?
                    'Wild Sage Node' : node_type
                  } <Link to={`/node/${popup.node_id}`}>
                    {popup.vsn}
                  </Link>
                </h2>
                <table className="key-value simple">
                  <tbody>
                    <tr>
                      <td>Project</td>
                      <td>
                        <Link to={`/nodes/?project="${encodeURIComponent(project)}"`}>
                          {project}
                        </Link>&nbsp;
                      (<Link to={
                          `/nodes/?project="${encodeURIComponent(project)}"` +
                        `&focus="${encodeURIComponent(focus)}"`
                        }>
                          {focus}
                        </Link>)
                      </td>
                    </tr>
                    <tr>
                      <td>Location</td>
                      <td>
                        <Link to={`/nodes/?location="${encodeURIComponent(location)}"`}>
                          {location}
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>Coordinates</td>
                      <td><Clipboard content={`${lat},\n${lng}`} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ClickAwayListener>
          </Popup>}
      </Map>

    </Root>
  )
}


const Root = styled.div`
  width: 100%;
  flex-grow: 4;

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
  }

  table td:first-child {
    width: 100px;
    text-align: right;
  }
`
