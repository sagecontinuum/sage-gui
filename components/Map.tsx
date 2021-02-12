import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import mapboxgl from 'mapbox-gl'
import token from '../mapbox-token'
import { SettingsInputHdmi } from '@material-ui/icons'

const center = [-100, 50]
const initialZoom = 1.5


const loadMap = (domRef) => {
	mapboxgl.accessToken = token

  const map = new mapboxgl.Map({
      container: domRef.current,
      style: 'mapbox://styles/mapbox/light-v10',
      center,
      zoom: initialZoom
  })

  map.addControl(new mapboxgl.FullscreenControl({container: domRef.current}));

  return map
}



const getMarkerColor = (status) => {
  if (status == 'active')
    return '#4ddb94'
  else if (status == 'degraded')
    return 'hsl(41, 83%, 35%)'
  else if (status == 'failed')
    return 'hsl(0, 83%, 35%)'
  else
    return 'hsl(0, 0%, 52.156862745098046%)'
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


const flyTo = (map, lon, lat, zoom = 10) => {
  map.flyTo({
    center: [lon, lat],
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
  const lons = coordinates.map(o => o.lon)
  const lats = coordinates.map(o => o.lat)

  const lonMin = Math.min(...lons)
  const lonMax = Math.max(...lons)
  const latMin = Math.min(...lats)
  const latMax = Math.max(...lats)

  return [[lonMin, latMin], [lonMax, latMax]]
}



const getValidCoords = (data) =>
  data.filter(({Lat, Lon}) => Lat && Lon && Lat != 'N/A' && Lon != 'N/A')
    .map(({Lat, Lon}) => ({lon: Lon, lat: Lat}))




const getGeoSpec = (data) => {
  const nodes = data
    .filter(({Lat, Lon}) => Lat && Lon && Lat != 'N/A' && Lon != 'N/A')
    .map(obj => ({
      type: "FeatureCollection",
      status: obj.status,
      geometry: {
        type: 'Point',
        coordinates: [obj.Lon, obj.Lat]
      }
    }))

  return {
    type: 'Nodes',
    features: nodes
  }
}

// todo: resize
const mapStyles = {
  border: '1px solid #ccc',
  width: 700,
  height: 475
}


type Props = {
  data: {Lon: number, Lat: number}[] // todo: update definition with actual schema
  updateID: number
}


function Map(props: Props) {
  const {data = null, updateID} = props

  const ref = useRef()
  const [init, setInit] = useState(false)
  const [map, setMap] = useState()
  const [markers, setMarkers] = useState()
  const [total, setTotal] = useState(null)

  // keep track of primary keys
  const [lastID, setLastID] = useState(-1)

  useEffect(() => {
    const map = loadMap(ref)
    setMap(map)
  }, [])

  useEffect(() => {
    if (!data || !map)
      return

    // if no matches, just clear the map
    if (!data.length) {
      clearMarkers(markers)
      return
    }

    // do a manual comparison for dynamic ping updates
    if (lastID == updateID)
      return

    // fly to box containing new data
    if (init && data != total) {
      const coords = getValidCoords(data)

      if (!coords.length) {
        return
      }

      const bbox = getBBox(coords)
      fitBounds(map, bbox)
    } else {
      recenter(map)
    }

    // remove markers (todo: probably should use layers?)
    clearMarkers(markers)

    const geoSpec = getGeoSpec(data)
    const newMarkers = renderMarkers(map, geoSpec)
    setMarkers(newMarkers)

    setInit(true)
    setTotal(data.length)
    setLastID(updateID)
  }, [data, map])

  return (
    <Root>
      <div id="map"
        ref={ref}
        style={mapStyles}
      >
      </div>
    </Root>
  )
}

const Root = styled.div`

`

export default Map
