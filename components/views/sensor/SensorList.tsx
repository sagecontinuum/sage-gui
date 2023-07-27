import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import Table from '/components/table/Table'

import * as BK from '/components/apis/beekeeper'

import { formatters } from '/apps/sage/jobs/JobStatus'
import { useProgress } from '/components/progress/ProgressProvider'
import ErrorMsg from '/apps/sage/ErrorMsg'

import { uniqBy } from 'lodash'

import settings from '/components/settings'
import config from '/config'

const {
  wifireData
} = config

const SAGE_UI_PROJECT = settings.project

const url = `${wifireData}/action/package_search` +
  `?facet.field=[%22organization%22,%22tags%22,%22res_format%22]` +
  `&rows=200` +
  `&fq=tags:(%22sensor%22)`


const columns = [{
  id: 'hardware',
  label: 'Hardware',
  format: (val, obj) =>
    obj.title ? <Link to={`/sensors/${obj.hw_model.replace(/ /g, '-')}`}>{val}</Link> : val,
  width: '250px'
}, {
  id: 'hw_model',
  label: 'Model ID',
  width: '250px'
}, {
  id: 'title',
  label: 'Description',
  format: (title, obj) => {
    const {description} = obj
    const len = 250
    const shortend = description.slice(0, len)

    const linkID = obj.hw_model.replace(/ /g, '-')

    return (
      <div>
        {title ?
          <h3><Link to={`/sensors/${linkID}`}>{title}</Link></h3> :
          '-'}
        {description.length > len ?
          <>{shortend}... <Link to={`/sensors/${linkID}`}>read more</Link></>
          : description}
      </div>
    )
  }
}, {
  id: 'nodeCount',
  label: 'Nodes',
  format: (count, obj) =>
    <Link to={`/nodes?sensor="${encodeURIComponent(obj.hw_model)}"`}>
      {count} node{count != 1 ? 's' : ''}
    </Link>,
  width: '100px'
}, {
  id: 'vsns',
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

    const prom1 = BK.getNodeMeta({project: SAGE_UI_PROJECT})
      .then(data => {
        const d = Object.values(data)
        return d
      })

    const prom2 = BK.getManifests()

    const prom3 = fetch(url)
      .then(res => res.json())
      .then(data => data.result.results)

    Promise.all([prom1, prom2, prom3])
      .then(([nodeMetas, manifests, details]) => {
        const vsns = nodeMetas.map(o => o.vsn)
        manifests = manifests.filter(o => vsns.includes(o.vsn))

        const sensors = uniqBy(manifests.flatMap(o => o.sensors), 'hw_model')
          .map(({hardware, hw_model}) => ({hardware, hw_model}))

        const data = sensors.map(({hardware, hw_model}) => {
          const meta = details.find(o => {
            return o.name.toLowerCase().replace(/ /g, '-') == hw_model.toLowerCase().replace(/ /g, '-')
          })

          const nodes = manifests
            .filter(o => o.sensors.map(o => o.hw_model).includes(hw_model))
          const vsns = nodes.map(o => o.vsn)

          return {
            hardware,
            hw_model,
            title: meta?.title,
            description: meta?.notes || '-',
            vsns,
            nodeCount: vsns.length
          }
        })

        setData(data)
      }).catch((err) => setError(err))
      .finally(() => setLoading(false))

  }, [setLoading])

  return (
    <Root>
      <h1>Sensors</h1>
      {data &&
        <Table
          primaryKey="id"
          columns={columns}
          rows={data}
          enableSorting
          sort="-title"
          onColumnMenuChange={() => {}}
          onDoubleClick={(_, row) => row.title && navigate(`/sensors/${row.hw_model.replace(/ /g, '-')}`)}
        />
      }

      {error && <ErrorMsg>{error}</ErrorMsg>}
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
