import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import mapboxgl from 'mapbox-gl'
import token from '../mapbox-token'

const loadMap = (domRef) => {
	mapboxgl.accessToken = token

  const map = new mapboxgl.Map({
      container: domRef.current,
      style: 'mapbox://styles/mapbox/light-v10',
      center: [-98, 39],
      zoom: 2.95
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
  width: 600,
  height: 475
}


type Props = {
  data: object[]
}

function Map(props: Props) {
  const {data} = props

  const ref = useRef()

  const [map, setMap] = useState()
  const [markers, setMarkers] = useState()

  useEffect(() => {
    const map = loadMap(ref)
    setMap(map)
  }, [])

  useEffect(() => {
    if (!data || !map) return

    // remove markers (todo: probably should use layers)
    (markers || []).forEach(marker => marker.remove())

    const geoSpec = getGeoSpec(data)
    const newMarkers = renderMarkers(map, geoSpec)
    setMarkers(newMarkers)
  }, [data, map])

  return (
    <Root>
      <div id="map"
        ref={ref} style={mapStyles}></div>
    </Root>
  )
}

const Root = styled.div`

`

export default Map
