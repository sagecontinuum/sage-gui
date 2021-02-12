import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import mapboxgl from 'mapbox-gl'
import token from '../mapbox-token'

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
    padding: {top: 10, bottom:25, left: 15, right: 5},
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
}


function Map(props: Props) {
  const {data = null} = props

  const ref = useRef()

  const [init, setInit] = useState(false)
  const [map, setMap] = useState()
  const [markers, setMarkers] = useState()
  const [total, setTotal] = useState(null)

  useEffect(() => {
    const map = loadMap(ref)
    setMap(map)
  }, [])

  useEffect(() => {
    if (!data || !map) return

    if (init && data != total) {
      const coords = getValidCoords(data)
      const bbox = getBBox(coords)
      fitBounds(map, bbox)
    } else {
      recenter(map)
    }

    // remove markers (todo: probably should use layers?)
    (markers || []).forEach(marker => marker.remove())

    const geoSpec = getGeoSpec(data)
    const newMarkers = renderMarkers(map, geoSpec)
    setMarkers(newMarkers)

    setInit(true)
    setTotal(data.length)
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
