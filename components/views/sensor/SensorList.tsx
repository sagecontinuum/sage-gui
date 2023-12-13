import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import Table from '/components/table/Table'
import * as BK from '/components/apis/beekeeper'
import { useProgress } from '/components/progress/ProgressProvider'

import { formatters } from '/apps/sage/jobs/JobStatus'
import ErrorMsg from '/apps/sage/ErrorMsg'

import { marked } from 'marked'


const getTitle = (hardware: string, description: string) => {
  const match = description.match(/^#\s+(.+)\r\n/m)
  const title = match ? match[1] : null
  return title ? title : hardware
}


const getDescriptionHTML = (description: string, hw_model: string) => {
  if (!description) return

  // ignore h1 titles since handled separately for links
  const match = description.match(/^#\s+(.+)\r\n/m)
  const title = match ? match[0] : null
  const text = description.replace(title, '')

  const intro = text.split(/^\s+\r\n/m)[0]

  if (intro.length < text.length)
    return (
      <>
        <span dangerouslySetInnerHTML={{__html: marked(intro)}}></span>
        <Link to={`/sensors/${hw_model}`}>read more...</Link>
      </>
    )

  return <span dangerouslySetInnerHTML={{__html: marked(intro)}}></span>
}


export const columns = [{
  id: 'hw_model',
  label: 'Model',
  width: '200px',
  format: (val, obj) =>
    <div>
      <small className="muted"><b>{obj.manufacturer}</b></small>
      <div>{val}</div>
    </div>

}, {
  id: 'hardware',
  label: 'Developer Name (UUID)',
  format: (val, obj) =>
    <Link to={`/sensors/${obj.hardware}`}>{val}</Link>,
  hide: true
}, {
  id: 'description',
  label: 'Description',
  format: (description, obj) => {
    const {hardware, hw_model} = obj

    return (
      <div>
        <h3>
          <Link to={`/sensors/${hw_model}`}>
            {getTitle(hardware, description)}
          </Link>
        </h3>
        {getDescriptionHTML(description, hw_model)}
      </div>
    )
  }
}, {
  id: 'capabilities',
  label: 'Capabilities',
  format:(val) => val ? val.join(', ') : '-',
  hide: true
}, {
  id: 'nodeCount',
  label: 'Nodes',
  format: (_, obj) => {
    const count = obj.vsns.length
    return (
      <Link to={`/nodes?sensor="${encodeURIComponent(obj.hw_model)}"`}>
        {count} node{count != 1 ? 's' : ''}
      </Link>
    )
  },
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

  const [data, setData] = useState<BK.SensorListRow[]>()
  const [error, setError] = useState()
  const {setLoading} = useProgress()

  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)

    BK.getSensors()
      .then(data => setData(data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [setLoading, project, focus, nodes])

  return (
    <Root>
      {data &&
        <Table
          primaryKey="id"
          columns={columns}
          rows={data}
          enableSorting
          sort="+hw_model"
          onColumnMenuChange={() => { /* do nothing */ }}
          onDoubleClick={(_, row: BK.SensorListRow) => navigate(`/sensors/${row.hw_model}`)}
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
