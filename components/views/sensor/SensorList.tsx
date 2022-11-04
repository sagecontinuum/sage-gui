import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import Table from '/components/table/Table'

import * as BK from '/components/apis/beekeeper'
import { Card, CardViewStyle } from '/components/layout/Layout'
import { formatters } from '/apps/sage/jobs/JobStatus'
import { useProgress } from '/components/progress/ProgressProvider'
import ErrorMsg from '/apps/sage/ErrorMsg'

import config from '/config'
const {
  sageCommons,
  unavaiable_sensor_details
} = config

const url = `${sageCommons}/action/package_search` +
  `?facet.field=[%22organization%22,%22tags%22,%22res_format%22]` +
  `&fq=tags:(%22sensor%22)`


const columns = [{
  id: 'name',
  label: 'Name',
  format: (name, obj) =>
    unavaiable_sensor_details.includes(obj.id) ?
      name :
      <Link to={`/sensors/${obj.id}`}>{name}</Link>,
  width: '170px'
}, {
  id: 'id',
  label: 'ID',
  width: '100px'
}, {
  id: 'title',
  label: 'Description',
  format: (title, obj) => {
    const {description} = obj
    const len = 250
    const shortend = description.slice(0, len)

    return (
      <div>
        {title ?
          <h3><Link to={`/sensors/${obj.id}`}>{title}</Link></h3> :
          '-'}
        {description.length > len ?
          <>{shortend}... <Link to={`/sensors/${obj.id}`}>read more</Link></>
          : description}
      </div>
    )
  }
}, {
  id: 'nodeCount',
  label: 'Nodes',
  format: (count, obj) =>
    <Link to={`/nodes?sensor="${encodeURIComponent(obj.name)}"`}>
      {count} node{count != 1 ? 's' : ''}
    </Link>,
  width: '100px'
}, {
  id: 'nodes',
  label: 'Node List',
  format: formatters.nodes,
  hide: true
}]


export default function SensorList() {
  const [data, setData] = useState()
  const [error, setError] = useState()
  const {setLoading} = useProgress()

  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)

    const prom1 = BK.getManifest({by: 'vsn'})
      .then(data => {
        const d = Object.values(data)
        const sensors = [...new Set(d.flatMap(({sensor}) => sensor))]
          .map(name => name)

        return {
          sensors,
          manifests: d
        }
      })

    const prom2 = fetch(url)
      .then(res => res.json())
      .then(data => data.result.results)

    Promise.all([prom1, prom2])
      .then(([{sensors, manifests}, details]) => {
        const data = sensors.map(name => {
          const id = name.includes('(') ?
            name.slice( name.indexOf('(') + 1, name.indexOf(')') ) : name

          const meta = details.find(o => o.name == id.toLowerCase())

          const nodes = manifests
            .filter(o => o.sensor.includes(name))

          const vsns = nodes.map(o => o.vsn)
          const node_ids = nodes.map(o => o.node_id)

          return {
            name,
            id,
            title: meta?.title,
            description: meta?.notes || '-',
            nodes: vsns,
            node_ids,
            nodeCount: vsns.length
          }
        })

        setData(data)
      }).catch((err) => setError(err))
      .finally(() => setLoading(false))

  }, [])

  return (
    <Root>
      <CardViewStyle />

      <Card>
        <h1>Sensors</h1>
        {data &&
          <Table
            primaryKey="id"
            columns={columns}
            rows={data}
            enableSorting
            sort="+id"
            onColumnMenuChange={() => {}}
            onDoubleClick={(_, row) => row.title && navigate(`/sensors/${row.id}`)}
          />
        }

        {error && <ErrorMsg>{error}</ErrorMsg>}
      </Card>
    </Root>
  )
}

const Root = styled.div`
  margin: 1em;

  h1 {
    margin: 0;
  }

  h3 {
    margin: 0 0 .5em 0;
  }
`
