import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import Table from '/components/table/Table'
import * as BK from '/components/apis/beekeeper'
import { useProgress } from '/components/progress/ProgressProvider'

import { formatters } from '/apps/sage/jobs/JobStatus'
import ErrorMsg from '/apps/sage/ErrorMsg'

import { uniqBy } from 'lodash'
import { marked } from 'marked'



const getTitle = (hardware: string, hw_model: string) =>
  hardware.toLowerCase() == hw_model.toLowerCase() ? hardware : `${hardware} (${hw_model})`


const getDescriptionHTML = (description: string, hw_model: string) => {
  if (!description) return

  const maxSentences = 1
  const sentences = description.split('. ')
  const count = sentences.length
  const shortend = sentences.slice(0, maxSentences).join('. ') + '.'

  if (count > maxSentences)
    return (
      <>
        <span dangerouslySetInnerHTML={{__html: marked(shortend)}}></span>
        <Link to={`/sensors/${hw_model}`}>read more...</Link>
      </>
    )

  return <span dangerouslySetInnerHTML={{__html: marked(shortend)}}></span>
}


const columns = [{
  id: 'hardware',
  label: 'Name',
  format: (val, obj) =>
    <Link to={`/sensors/${obj.hw_model}`}>{val}</Link>,
  width: '250px'
}, {
  id: 'hw_model',
  label: 'Model ID',
  width: '250px'
}, {
  id: 'description',
  label: 'Description',
  format: (description, obj) => {
    const {hardware, hw_model} = obj

    return (
      <div>
        <h3>
          <Link to={`/sensors/${hw_model}`}>
            {getTitle(hardware, hw_model)}
          </Link>
        </h3>
        {getDescriptionHTML(description, hw_model)}
      </div>
    )
  }
}, {
  id: 'capabilities',
  label: 'Capabilities',
  format:(val, obj) => val ? val.join(', ') : '-',
  hide: true
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


type Props = {
  project?: string
  focus?: string
  nodes?: BK.VSN[]
}


export default function SensorList(props: Props) {
  const {project, focus, nodes} = props

  const [data, setData] = useState()
  const [error, setError] = useState()
  const {setLoading} = useProgress()

  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)

    const prom1 = BK.getNodeMeta({project, focus, nodes})
      .then(data => {
        const d = Object.values(data)
        return d
      })

    const prom2 = BK.getManifests()

    Promise.all([prom1, prom2])
      .then(([nodeMetas, manifests]) => {
        const vsns = nodeMetas.map(o => o.vsn)
        manifests = manifests.filter(o => vsns.includes(o.vsn))

        const sensors = uniqBy(manifests.flatMap(o => o.sensors), 'hw_model')

        const data = sensors.map(({hardware, hw_model, capabilities, description}) => {
          const nodes = manifests
            .filter(o => o.sensors.map(o => o.hw_model).includes(hw_model))
          const vsns = nodes.map(o => o.vsn)

          return {
            hardware,
            hw_model,
            capabilities,
            description,
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
          sort="-hw_model"
          onColumnMenuChange={() => {}}
          onDoubleClick={(_, row) => navigate(`/sensors/${row.hw_model.replace(/ /g, '-')}`)}
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
