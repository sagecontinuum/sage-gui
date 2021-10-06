import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import mapboxgl from 'mapbox-gl'
import tokens from '../tokens'
import config from '../config'


const DISABLE_MAP = config.admin['disableMap'] || false
const center = [-100, 50]
const initialZoom = 1.5

const minHeight = '225px'
const maxHeight = '350px'


const loadMap = (domRef) => {
  mapboxgl.accessToken = process.env.MAPBOX_TOKEN || tokens.mapbox

  const map = new mapboxgl.Map({
    container: domRef.current,
    style: 'mapbox://styles/mapbox/light-v10',
    center,
    zoom: initialZoom
  })

  map.on('load', () => {
    map.resize()
  })

  map.addControl(new mapboxgl.FullscreenControl({container: domRef.current}))

  return map
}



const getMarkerColor = (status) => {
  if (status == 'reporting')
    return '#3ac37e'
  else if (status == 'degraded')
    return 'hsl(41, 83%, 35%)'
  else if (status == 'not reporting')
    return '#d72020'
  else
    return '#aaa'
}



const renderMarkers = (map, data) => {
  const markers = data.features.map(marker => {
    return new mapboxgl.Marker({color: getMarkerColor(marker.status)} )
      .setLngLat(marker.geometry.coordinates)
      .addTo(map)
  })

  return markers
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
      type: 'FeatureCollection',
      status: obj.status,
      geometry: {
        type: 'Point',
        coordinates: [obj.lng, obj.lat]
      }
    }))

  return {
    type: 'Nodes',
    features: nodes
  }
}



type Data = {id: string, lng: number, lat: number}[]

type Props = {
  data: Data
  selected: Data
  updateID: number
}


function Map(props: Props) {
  const {data = null, selected, updateID} = props

  const ref = useRef()
  const [init, setInit] = useState(false)
  const [map, setMap] = useState(null)
  const [markers, setMarkers] = useState()
  const [total, setTotal] = useState(null)

  // keep track of primary keys
  const [lastID, setLastID] = useState(-1)



  useEffect(() => {
    if (DISABLE_MAP) return

    const map = loadMap(ref)
    setMap(map)

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

    // remove markers (todo: probably use layers?)
    clearMarkers(markers)

    // add new markers
    const geoSpec = getGeoSpec(filteredData)
    const newMarkers = renderMarkers(map, geoSpec)
    setMarkers(newMarkers)

    setInit(true)
    setTotal(data.length)
    setLastID(updateID)
  }

  return (
    <Root>
      <MapContainer id="map" ref={ref} />
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
  transition: height 100ms;
`


export default Map
