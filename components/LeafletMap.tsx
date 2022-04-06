import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: 'http://leafletjs.com/examples/custom-icons/leaf-green.png',
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  // iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
})


type Props = {
  data: {lat, lon} | {lat, lon}[]
}

export default function LeafMap(props: Props) {
  const {data} = props

  const ref = useRef()
  const [init, setInit] = useState(false)


  useEffect(() => {
    if (!data || init)
      return

    let d = Array.isArray(data) ? data : [data]

    if (!(d[0].lat || d[0].lon))
      return

    const center = [d[0].lat, d[0].lon]
    const coords = d.map(o => [o.lat, o.lon])


    let map = L.map(ref.current).setView(center, 13)
    map.zoomControl.setPosition('topright')


    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(map)

    coords.forEach(([lat, lon]) => {
      let marker = L.marker([lat, lon]).addTo(map)
      marker.bindTooltip("VSN", {permanent: true, className: "marker-label", offset: [10, 10], direction: "center",});
    })

    let bounds = new L.LatLngBounds(coords)
    map.fitBounds(bounds, {padding: [100, 100]})

    setInit(true)

    return () => {
      map.off();
      map.remove();
    }
  }, [data])

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

  .map .leaflet-popup-tip-container {
    display: none;
}

  .map .marker-label {
    background: none !important;

    :before {
      border-left-color: none !important;
    }

    color: #444;
    font-weight: 800;
    pointer-events: none;
    background-color: #fff;
    border: none;
    /* border-radius: 3px; */
    padding: 6px;
    position: absolute;
    box-shadow: none;

  }
`
