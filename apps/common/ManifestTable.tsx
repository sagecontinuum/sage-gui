import styled from 'styled-components'
import {Link} from 'react-router-dom'

function format(label: string, val: string) {
  if (label == 'project')
    return <Link to={`/nodes?project="${encodeURIComponent(val)}"`}>{val}</Link>
  else if (label == 'location')
    return <Link to={`/nodes?location="${encodeURIComponent(val)}"`}>{val}</Link>

  return typeof val == 'boolean' ?
    (val ? 'yes' : 'no'):
    ((!val || val == 'none') ? '-' : val)
}


const cols = [
  'node_type',
  // 'vsn',
  // 'node_id',
  'project',
  'location',
  'top_camera',
  'bottom_camera',
  'left_camera',
  'right_camera',
  'shield',
  'modem',
  'modem_sim',
  'nx_agent',
  'build_date',
  'commission_date'
]

type Props = {
  manifest: object
  meta: object
}

export default function ManifestTable(props: Props) {
  const {manifest, meta} = props

  return (
    <Root>

      {manifest &&
        <table className="hor-key-value manifest">
          <thead>
            <tr className="cat-header">
              {cols.map(name => name == 'top_camera' ?
                <th key={name} colSpan="4">Cameras</th> :
                <th key={name}></th>
              ).slice(0, -3)
              }
              <th></th>
            </tr>

            <tr>
              {cols.map(name => {
                const label = name.replace(/_/g, ' ').replace('camera', '')
                  .replace(/\b[a-z](?=[a-z]{1})/g, c => c.toUpperCase())
                return <th key={label}>{label}</th>
              })}
              <th>Registration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {cols.map(name => {
                const val = manifest[name]
                return <td key={name}>{format(name, val)}</td>
              })}
              <td>{new Date(meta?.registration_event).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      }
    </Root>
  )
}

const Root = styled.div`

`
