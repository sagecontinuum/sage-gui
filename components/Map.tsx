import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import mapboxgl from 'mapbox-gl'
import tokens from '../tokens'
import settings from '/apps/admin-ui/settings'

// import Popover from '@mui/material/Popover'

const DISABLE_MAP = settings['disableMap'] || false
const center = [-99, 38.5]
const initialZoom = 3.0
const dotSize = 10

const minHeight = '225px'
const maxHeight = '350px'


const loadMap = (domRef, resize) => {
  mapboxgl.accessToken = process.env.MAPBOX_TOKEN || tokens.mapbox

  const map = new mapboxgl.Map({
    container: domRef.current,
    style: 'mapbox://styles/mapbox/light-v9',
    center,
    zoom: initialZoom
  })

  if (resize) {
    map.on('load', () => {
      map.resize()
    })
  }

  map.addControl(new mapboxgl.FullscreenControl({container: domRef.current}))

  return map
}



const renderMarkers = (map, data) => {
  const markers = data.features.map(marker => {
    const {data} = marker.properties
    // todo: optimize popups by using 'onclick'
    var el = document.createElement('div')
    el.className = 'marker'
    el.innerHTML = `<div class="marker-dot marker-${marker.status.replace(' ', '-')}"></div>`

    return new mapboxgl.Marker(el).setLngLat(marker.geometry.coordinates)
      .addTo(map)
      .setPopup(
        new mapboxgl.Popup({ offset: dotSize + 2 })
          .setHTML(
            `<h3 class="popup-title">${marker.properties.title}</h3>
            <table class="key-value simple">
              <tr><td>Project</td><td>${data.project} (${data.focus})</td><tr>
              <tr><td>Location</td><td>${data.location}</td><tr>
              <tr><td>ID</td><td>${data.id}</td><tr>
              <tr><td>Coordinates</td><td>${data.lat}<br>${data.lng}</td><tr>
            </table>
            <p>${marker.properties.description}</p>`
          )
      )
  })

  return markers
}

const renderLabels = (map, geoSpec) => {
  map.addSource('geoSpec', {
    'type': 'geojson',
    'data': geoSpec
  })

  map.addLayer({
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
  })
}


const clearMarkers = (markers) =>
  (markers || []).forEach(marker => marker.remove())


const recenter = (map) => {
  flyTo(map, center[0], center[1], initialZoom)
}


const flyTo = (map, lng, lat, zoom = 10) => {
  map.flyTo({
    center: [lng, lat],
    essential: true,
    zoom
  })
}


const fitBounds = (map, bbox) => {
  map.fitBounds(bbox, {
    padding: {top: 35, bottom: 35, left: 35, right: 35},
    maxZoom: 10
  })
}


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



type Data = {id: string, lng: number, lat: number}[]

type Props = {
  data: Data
  selected: Data
  updateID: number
  resize?: boolean
}


function Map(props: Props) {
  const {
    data = null,
    selected,
    updateID,
    resize = true
  } = props

  const ref = useRef()
  const [init, setInit] = useState(false)
  const [map, setMap] = useState(null)
  const [markers, setMarkers] = useState()
  const [total, setTotal] = useState(null)

  // keep track of primary keys
  const [lastID, setLastID] = useState(-1)

  // popover content
  // const [popup, setPopup] = useState<string>(false)


  useEffect(() => {
    if (DISABLE_MAP) return

    const map = loadMap(ref, resize)
    setMap(map)

    if (!resize) return

    window.onscroll = () => {
      if (document.documentElement.scrollTop > 0) {
        document.getElementById('map').style.height = minHeight
      } else {
        document.getElementById('map').style.height = maxHeight
      }

      setTimeout(() => {
        map.resize()
      }, 300)
    }
  }, [])

  useEffect(() => {
    if (!map) return
    updateMap()
  }, [map, data, selected, updateID])

  const updateMap = () => {
    if (!data || !map)
      return

    // if no matches, just clear the map
    if (!data.length) {
      clearMarkers(markers)
      return
    }

    // do a manual comparison for dynamic ping updates
    if (lastID == updateID) {
      return
    }

    // filter selected if needed
    const filteredData = selected ?
      data.filter(obj => selected.map(o => o.id).includes(obj.id) ) : data

    // fly to box containing new data
    if (init && data != total) {
      const coords = getValidCoords(filteredData)

      if (coords.length) {
        const bbox = getBBox(coords)
        fitBounds(map, bbox)
      } else {
        recenter(map)
      }
    } else {
      recenter(map)
    }

    // remove markers/labels (todo: use layers for markers too?)
    clearMarkers(markers)

    if(map.getLayer('marker-labels')) {
      map.removeLayer('marker-labels')
        .removeSource('geoSpec')
    }

    // add new markers
    const geoSpec = getGeoSpec(filteredData)
    const newMarkers = renderMarkers(map, geoSpec)

    try {
      renderLabels(map, geoSpec)
    } catch(e) {
      // need delay for initial styling load
      setTimeout(() => {
        renderLabels(map, geoSpec)
      }, 1500)
    }

    document.querySelectorAll('.mapboxgl-marker').forEach(el =>
      el.addEventListener('click', (evt) => {
      })
    )


    setMarkers(newMarkers)

    setInit(true)
    setTotal(data.length)
    setLastID(updateID)
  }

  return (
    <Root>
      <MapContainer id="map" ref={ref} />

      {/* todo: implement?
      <Popover
        open={!!popover}
        anchorOrigin={{
          vertical: 'top',
        }}
        transformOrigin={{
          vertical: 'top',
        }}
      >
        {popover}
      </Popover>
      */}
    </Root>
  )
}

const Root = styled.div`
  width: 100%;
  flex-grow: 4;
`


const MapContainer = styled.div`
  border: 1px solid #ccc;
  width: 100%;
  height: ${maxHeight};

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
`


export default Map
