import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import L from 'leaflet'


import type {Manifest} from '/components/apis/beekeeper'


type Props = {
  manifest: Manifest
}

export default function LeafMap(props: Props) {
  const {manifest} = props

  const ref = useRef()
  const [init, setInit] = useState(false)


  useEffect(() => {
    if (!manifest || init) return

    const {gps_lat, gps_lon} = manifest

    let map = L.map(ref.current).setView([gps_lat, gps_lon], 13);

    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.marker([gps_lat, gps_lon]).addTo(map)
    setInit(true)
  }, [manifest])

  return (
    <Root>
      <div ref={ref} className="map" />
    </Root>
  )
}

const Root = styled.div`
  .map {
    width: 400px;
    height: 400px;
  }
`
